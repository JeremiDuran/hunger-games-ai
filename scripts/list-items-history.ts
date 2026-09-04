/**
 * Hunger Games AI — Item History & Inventory Lineage Tracker
 *
 * Reconstructs the complete lifecycle, custody chain, and economy of every item
 * across a simulation match by analyzing:
 *   1. `public.tributes.inventory` (final persisted inventories)
 *   2. `public.game_phase_events.state_delta` (chronological itemsGained, itemsLost, itemsConsumed, itemsDestroyed)
 *   3. Phase event casualty & combat transfers (dropInventoryOnDeath)
 *
 * Usage:
 *   npx tsx scripts/list-items-history.ts [gameId] [--tribute="Name"] [--item="Name"] [--summary-only]
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Database } from "../src/types/database";
import { EngineItem, ItemCategory, ItemTier } from "../src/lib/engine/items/types";

// ---------------------------------------------------------------------------
// 1. Environment Configuration
// ---------------------------------------------------------------------------
function loadEnv(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------------
// 2. Data Types for Item History Tracking
// ---------------------------------------------------------------------------

export type ItemActionType =
  | "SPAWNED"
  | "ACQUIRED"
  | "LOOTED"
  | "CONSUMED"
  | "LOST"
  | "DESTROYED"
  | "CARRIED_TO_END"
  | "RETAINED_ON_CORPSE";

export interface ItemEventRecord {
  phaseOrder: number;
  dayNumber: number;
  phaseType: string;
  eventOrder: number;
  action: ItemActionType;
  tributeId: string;
  tributeName: string;
  district: number;
  details: string;
  sourceTributeName?: string;
}

export interface ItemLifecycle {
  id?: string;
  name: string;
  category: ItemCategory | "unknown";
  tier: ItemTier | "unknown";
  originPhase: string;
  firstAcquiredBy: string;
  firstAcquiredDistrict: number;
  history: ItemEventRecord[];
  currentHolderId: string | null;
  currentHolderName: string | null;
  currentHolderStatus: "alive" | "dead" | "consumed" | "lost";
  isCarriedByVictor: boolean;
  transfersCount: number;
}

export interface TributeItemSummary {
  id: string;
  name: string;
  district: number;
  status: "alive" | "dead";
  placement: number | null;
  kills: number;
  itemsAcquiredCount: number;
  itemsLootedCount: number;
  itemsConsumedCount: number;
  finalInventory: string[];
}

// ---------------------------------------------------------------------------
// 3. Normalization Helpers
// ---------------------------------------------------------------------------

function normalizeItem(raw: unknown): { id?: string; name: string; category: ItemCategory | "unknown"; tier: ItemTier | "unknown" } {
  if (typeof raw === "string") {
    const tier = inferTier(raw);
    const category = inferCategory(raw);
    return { name: raw.trim(), category, tier };
  }
  if (raw && typeof raw === "object") {
    const item = raw as Partial<EngineItem>;
    const name = String(item.name || "Unknown Item").trim();
    const category = item.category || inferCategory(name);
    const tier = item.tier || inferTier(name);
    return { id: item.id, name, category, tier };
  }
  return { name: "Unknown Item", category: "unknown", tier: "unknown" };
}

function inferTier(name: string): ItemTier {
  const lower = name.toLowerCase();
  if (lower.includes("gilded") || lower.includes("masterwork") || lower.includes("capitol") || lower.includes("flawless")) {
    return "legendary";
  }
  if (lower.includes("refined") || lower.includes("combat") || lower.includes("tactical") || lower.includes("serrated")) {
    return "rare";
  }
  return "common";
}

function inferCategory(name: string): ItemCategory {
  const lower = name.toLowerCase();
  if (
    lower.includes("knife") ||
    lower.includes("saw") ||
    lower.includes("axe") ||
    lower.includes("maul") ||
    lower.includes("hook") ||
    lower.includes("blade") ||
    lower.includes("spear") ||
    lower.includes("bow") ||
    lower.includes("sword")
  ) {
    return "weapon";
  }
  if (lower.includes("suture") || lower.includes("bandage") || lower.includes("ointment") || lower.includes("med") || lower.includes("tourniquet")) {
    return "medical";
  }
  if (lower.includes("biscuit") || lower.includes("thermos") || lower.includes("coffee") || lower.includes("bread") || lower.includes("ration") || lower.includes("water") || lower.includes("jerky")) {
    return "sustenance";
  }
  if (lower.includes("apron") || lower.includes("vest") || lower.includes("shield") || lower.includes("jacket") || lower.includes("armor") || lower.includes("helmet")) {
    return "armor";
  }
  return "tool";
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case "weapon":
      return "🗡️";
    case "medical":
      return "💊";
    case "sustenance":
      return "🍞";
    case "armor":
      return "🛡️";
    case "tool":
      return "🔧";
    default:
      return "📦";
  }
}

function getTierBadge(tier: string): string {
  switch (tier) {
    case "legendary":
      return "👑 LEGENDARY";
    case "rare":
      return "🔷 RARE";
    default:
      return "⚪ COMMON";
  }
}

// ---------------------------------------------------------------------------
// 4. Main Reconstruction Pipeline
// ---------------------------------------------------------------------------

async function runItemHistoryTracker(): Promise<void> {
  const args = process.argv.slice(2);
  const targetGameIdArg = args.find((a) => !a.startsWith("--"));
  const tributeFilter = args.find((a) => a.startsWith("--tribute="))?.split("=")[1]?.toLowerCase();
  const itemFilter = args.find((a) => a.startsWith("--item="))?.split("=")[1]?.toLowerCase();
  const summaryOnly = args.includes("--summary-only");

  console.log(`\n=======================================================`);
  console.log(` 📦 HUNGER GAMES AI — ITEM HISTORY & INVENTORY LINEAGE`);
  console.log(`=======================================================`);

  // Step 0: Authenticate
  const adminEmail = process.env.ADMIN_EMAIL || "jeremiduran17@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminPassword) {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (authError) {
      console.warn(`⚠️ Warning: Authentication failed (${authError.message}), attempting anonymous queries...`);
    } else {
      console.log(`👤 Authenticated as Head Gamemaker (${adminEmail})`);
    }
  }

  // Step 1: Resolve Target Game
  let gameId: string;
  if (targetGameIdArg) {
    gameId = targetGameIdArg;
  } else {
    const { data: latestGames, error: gameQueryError } = await supabase
      .from("games")
      .select("id, title, status, arena_name, winner_id, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (gameQueryError || !latestGames || latestGames.length === 0) {
      console.error("❌ No games found in database:", gameQueryError?.message || "Empty result");
      process.exit(1);
    }
    const latestGame = latestGames[0];
    gameId = latestGame.id;
    console.log(`🎯 Target Match: "${latestGame.title}" (${latestGame.arena_name})`);
    console.log(`   • Game ID: ${gameId}`);
    console.log(`   • Status: ${latestGame.status.toUpperCase()}`);
  }

  // Fetch Game Metadata
  const { data: game, error: gError } = await supabase
    .from("games")
    .select("id, title, status, arena_name, winner_id, created_at")
    .eq("id", gameId)
    .single();

  if (gError || !game) {
    console.error(`❌ Game not found for ID ${gameId}`);
    process.exit(1);
  }

  // Step 2: Fetch Tributes
  const { data: tributesRows, error: tributesError } = await supabase
    .from("tributes")
    .select("id, name, district, status, placement, kill_count, inventory")
    .eq("game_id", gameId)
    .order("district", { ascending: true });

  if (tributesError || !tributesRows) {
    console.error("❌ Failed to fetch tributes:", tributesError?.message);
    process.exit(1);
  }

  const tributeMap = new Map<
    string,
    {
      id: string;
      name: string;
      district: number;
      status: "alive" | "dead";
      placement: number | null;
      kills: number;
      finalInventory: { name: string; tier: string; category: string }[];
    }
  >();

  for (const t of tributesRows) {
    const rawInv = Array.isArray(t.inventory) ? t.inventory : [];
    const finalInventory = rawInv.map((item) => normalizeItem(item));
    tributeMap.set(t.id, {
      id: t.id,
      name: t.name,
      district: t.district,
      status: t.status,
      placement: t.placement,
      kills: t.kill_count,
      finalInventory,
    });
  }

  // Step 3: Fetch Phases & Events
  const { data: phases, error: phasesError } = await supabase
    .from("game_phases")
    .select("id, phase_order, day_number, phase_type")
    .eq("game_id", gameId)
    .order("phase_order", { ascending: true });

  if (phasesError || !phases) {
    console.error("❌ Failed to fetch game phases:", phasesError?.message);
    process.exit(1);
  }

  const phaseMap = new Map(phases.map((p) => [p.id, p]));

  const { data: events, error: eventsError } = await supabase
    .from("game_phase_events")
    .select("id, phase_id, event_order, event_category, outcome_type, killer_ids, victim_ids, narrative_text, state_delta")
    .eq("game_id", gameId);

  if (eventsError || !events) {
    console.error("❌ Failed to fetch game phase events:", eventsError?.message);
    process.exit(1);
  }

  // Sort events chronologically by phase_order, then event_order
  const sortedEvents = events
    .map((e) => {
      const phase = phaseMap.get(e.phase_id);
      return {
        ...e,
        phaseOrder: phase?.phase_order ?? 999,
        dayNumber: phase?.day_number ?? 0,
        phaseType: phase?.phase_type ?? "unknown",
      };
    })
    .sort((a, b) => a.phaseOrder - b.phaseOrder || a.event_order - b.event_order);

  console.log(`📊 Loaded ${tributesRows.length} Tributes, ${phases.length} Phases, and ${sortedEvents.length} Events.`);

  // ---------------------------------------------------------------------------
  // Step 4: Reconstruct Item Lifecycles
  // ---------------------------------------------------------------------------

  // Map of normalized itemName -> ItemLifecycle
  const itemLifecycles = new Map<string, ItemLifecycle>();

  // Helper to get or create lifecycle
  function getOrCreateLifecycle(
    itemRaw: unknown,
    tributeId: string,
    phaseDesc: string
  ): ItemLifecycle {
    const { id, name, category, tier } = normalizeItem(itemRaw);
    const key = name.toLowerCase();

    let lifecycle = itemLifecycles.get(key);
    if (!lifecycle) {
      const tribute = tributeMap.get(tributeId);
      lifecycle = {
        id,
        name,
        category,
        tier,
        originPhase: phaseDesc,
        firstAcquiredBy: tribute?.name || "Unknown Tribute",
        firstAcquiredDistrict: tribute?.district || 0,
        history: [],
        currentHolderId: tributeId,
        currentHolderName: tribute?.name || "Unknown",
        currentHolderStatus: tribute?.status || "alive",
        isCarriedByVictor: false,
        transfersCount: 0,
      };
      itemLifecycles.set(key, lifecycle);
    }
    return lifecycle;
  }

  // In-memory tracker of who holds what at each step: tributeId -> Set of item names
  const liveInventories = new Map<string, Set<string>>();
  for (const t of tributesRows) {
    liveInventories.set(t.id, new Set<string>());
  }

  // Tribute Summary Stats
  const tributeSummaries = new Map<string, TributeItemSummary>();
  for (const t of tributesRows) {
    tributeSummaries.set(t.id, {
      id: t.id,
      name: t.name,
      district: t.district,
      status: t.status,
      placement: t.placement,
      kills: t.kill_count,
      itemsAcquiredCount: 0,
      itemsLootedCount: 0,
      itemsConsumedCount: 0,
      finalInventory: [],
    });
  }

  // Process all events chronologically
  for (const ev of sortedEvents) {
    const phaseDesc = `Day ${ev.dayNumber} ${ev.phaseType.toUpperCase()}`;
    const rawStateDelta = ev.state_delta as Record<string, any> | null;

    if (!rawStateDelta || typeof rawStateDelta !== "object") continue;

    const killerId = Array.isArray(ev.killer_ids) && ev.killer_ids.length > 0 ? ev.killer_ids[0] : undefined;
    const victimIds = Array.isArray(ev.victim_ids) ? ev.victim_ids : [];

    for (const [tributeId, delta] of Object.entries(rawStateDelta)) {
      if (!delta || typeof delta !== "object") continue;
      const tribute = tributeMap.get(tributeId);
      if (!tribute) continue;

      const summary = tributeSummaries.get(tributeId)!;
      const currentHolderItems = liveInventories.get(tributeId) || new Set<string>();

      // 1. ITEMS GAINED
      if (Array.isArray(delta.itemsGained) && delta.itemsGained.length > 0) {
        for (const itemRaw of delta.itemsGained) {
          const { name } = normalizeItem(itemRaw);
          const key = name.toLowerCase();
          const lifecycle = getOrCreateLifecycle(itemRaw, tributeId, phaseDesc);

          // Check if this was looted from a victim
          const wasLooted = victimIds.length > 0 && killerId === tributeId;
          const sourceVictim = wasLooted ? tributeMap.get(victimIds[0]) : undefined;

          if (wasLooted && sourceVictim) {
            summary.itemsLootedCount++;
            lifecycle.transfersCount++;
            lifecycle.history.push({
              phaseOrder: ev.phaseOrder,
              dayNumber: ev.dayNumber,
              phaseType: ev.phaseType,
              eventOrder: ev.event_order,
              action: "LOOTED",
              tributeId,
              tributeName: tribute.name,
              district: tribute.district,
              details: `Looted from ${sourceVictim.name} (District ${sourceVictim.district}) upon fatal strike`,
              sourceTributeName: sourceVictim.name,
            });
          } else {
            summary.itemsAcquiredCount++;
            const actionType: ItemActionType = lifecycle.history.length === 0 ? "SPAWNED" : "ACQUIRED";
            lifecycle.history.push({
              phaseOrder: ev.phaseOrder,
              dayNumber: ev.dayNumber,
              phaseType: ev.phaseType,
              eventOrder: ev.event_order,
              action: actionType,
              tributeId,
              tributeName: tribute.name,
              district: tribute.district,
              details: delta.narrativeNotes || `Acquired in ${ev.event_category} encounter`,
            });
          }

          lifecycle.currentHolderId = tributeId;
          lifecycle.currentHolderName = tribute.name;
          lifecycle.currentHolderStatus = tribute.status;
          currentHolderItems.add(key);
        }
      }

      // 2. ITEMS CONSUMED
      if (Array.isArray(delta.itemsConsumed) && delta.itemsConsumed.length > 0) {
        for (const itemRaw of delta.itemsConsumed) {
          const { name } = normalizeItem(itemRaw);
          const key = name.toLowerCase();
          const lifecycle = itemLifecycles.get(key);

          summary.itemsConsumedCount++;
          if (lifecycle) {
            lifecycle.history.push({
              phaseOrder: ev.phaseOrder,
              dayNumber: ev.dayNumber,
              phaseType: ev.phaseType,
              eventOrder: ev.event_order,
              action: "CONSUMED",
              tributeId,
              tributeName: tribute.name,
              district: tribute.district,
              details: delta.narrativeNotes || `Consumed for biometric recovery`,
            });
            lifecycle.currentHolderStatus = "consumed";
          }
          currentHolderItems.delete(key);
        }
      }

      // 3. ITEMS LOST / DESTROYED
      if (Array.isArray(delta.itemsLost) && delta.itemsLost.length > 0) {
        for (const itemRaw of delta.itemsLost) {
          const { name } = normalizeItem(itemRaw);
          const key = name.toLowerCase();
          const lifecycle = itemLifecycles.get(key);
          if (lifecycle) {
            lifecycle.history.push({
              phaseOrder: ev.phaseOrder,
              dayNumber: ev.dayNumber,
              phaseType: ev.phaseType,
              eventOrder: ev.event_order,
              action: "LOST",
              tributeId,
              tributeName: tribute.name,
              district: tribute.district,
              details: delta.narrativeNotes || `Lost during encounter`,
            });
            lifecycle.currentHolderStatus = "lost";
          }
          currentHolderItems.delete(key);
        }
      }

      liveInventories.set(tributeId, currentHolderItems);
    }
  }

  // Cross-reference with Final DB Inventories
  const victor = game.winner_id ? tributeMap.get(game.winner_id) : undefined;

  for (const [tId, tData] of tributeMap.entries()) {
    const isVictor = game.winner_id === tId;
    const summary = tributeSummaries.get(tId)!;

    for (const item of tData.finalInventory) {
      summary.finalInventory.push(item.name);
      const key = item.name.toLowerCase();
      let lifecycle = itemLifecycles.get(key);

      if (!lifecycle) {
        // Item was seeded or held without explicit gain event
        lifecycle = {
          name: item.name,
          category: inferCategory(item.name),
          tier: inferTier(item.name),
          originPhase: "Game Setup / Pre-Bloodbath",
          firstAcquiredBy: tData.name,
          firstAcquiredDistrict: tData.district,
          history: [
            {
              phaseOrder: 0,
              dayNumber: 0,
              phaseType: "setup",
              eventOrder: 0,
              action: "ACQUIRED",
              tributeId: tId,
              tributeName: tData.name,
              district: tData.district,
              details: "Held in starting inventory",
            },
          ],
          currentHolderId: tId,
          currentHolderName: tData.name,
          currentHolderStatus: tData.status,
          isCarriedByVictor: isVictor,
          transfersCount: 0,
        };
        itemLifecycles.set(key, lifecycle);
      }

      lifecycle.currentHolderId = tId;
      lifecycle.currentHolderName = tData.name;
      lifecycle.currentHolderStatus = tData.status;
      lifecycle.isCarriedByVictor = isVictor;

      if (isVictor) {
        lifecycle.history.push({
          phaseOrder: 999,
          dayNumber: sortedEvents[sortedEvents.length - 1]?.dayNumber ?? 0,
          phaseType: "conclusion",
          eventOrder: 999,
          action: "CARRIED_TO_END",
          tributeId: tId,
          tributeName: tData.name,
          district: tData.district,
          details: `Preserved in Victor's final inventory`,
        });
      } else if (tData.status === "dead") {
        lifecycle.history.push({
          phaseOrder: 999,
          dayNumber: sortedEvents[sortedEvents.length - 1]?.dayNumber ?? 0,
          phaseType: "conclusion",
          eventOrder: 999,
          action: "RETAINED_ON_CORPSE",
          tributeId: tId,
          tributeName: tData.name,
          district: tData.district,
          details: `Retained with unlooted remains`,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: Render Terminal Analytics & Visualizations
  // ---------------------------------------------------------------------------

  const allItems = Array.from(itemLifecycles.values());

  // Category counts
  const catCounts: Record<string, number> = {
    weapon: 0,
    medical: 0,
    sustenance: 0,
    armor: 0,
    tool: 0,
  };
  const tierCounts: Record<string, number> = {
    legendary: 0,
    rare: 0,
    common: 0,
  };
  let totalLootings = 0;
  let totalConsumptions = 0;

  for (const item of allItems) {
    catCounts[item.category] = (catCounts[item.category] || 0) + 1;
    tierCounts[item.tier] = (tierCounts[item.tier] || 0) + 1;
    totalLootings += item.transfersCount;
    if (item.currentHolderStatus === "consumed") totalConsumptions++;
  }

  // Print Section 1: Item Economy Matrix
  console.log(`\n=======================================================`);
  console.log(` 📊 1. ARENA ITEM ECONOMY & RESOURCE METRICS`);
  console.log(`=======================================================`);
  console.log(`   • Total Unique Items Tracked : ${allItems.length}`);
  console.log(`   • Weapon Armory              : ${catCounts.weapon} items`);
  console.log(`   • Medical & Suture Supplies  : ${catCounts.medical} items`);
  console.log(`   • Sustenance & Rations       : ${catCounts.sustenance} items`);
  console.log(`   • Defensive Armor Pieces     : ${catCounts.armor} items`);
  console.log(`   • Survival Field Tools       : ${catCounts.tool} items`);
  console.log(`   ----------------------------------------------------`);
  console.log(`   • Legendary Capitol Grade    : ${tierCounts.legendary} items`);
  console.log(`   • Rare Tactical Grade        : ${tierCounts.rare} items`);
  console.log(`   • Common Standard Grade      : ${tierCounts.common} items`);
  console.log(`   ----------------------------------------------------`);
  console.log(`   • Total Field Lootings       : ${totalLootings} transfers`);
  console.log(`   • Total Items Consumed       : ${totalConsumptions} items`);

  // Filter items if --item was provided
  const filteredItems = itemFilter
    ? allItems.filter((i) => i.name.toLowerCase().includes(itemFilter))
    : allItems;

  if (!summaryOnly) {
    // Print Section 2: Chronological Lineage per Item
    console.log(`\n=======================================================`);
    console.log(` 📜 2. ITEM PROVENANCE & CUSTODY CHAINS (${filteredItems.length} items)`);
    console.log(`=======================================================`);

    for (const item of filteredItems) {
      const catIcon = getCategoryIcon(item.category);
      const tierBadge = getTierBadge(item.tier);
      const victorBadge = item.isCarriedByVictor ? " [👑 IN VICTOR INVENTORY]" : "";

      console.log(`\n${catIcon} ${item.name} (${tierBadge})${victorBadge}`);
      console.log(`   • Origin: ${item.originPhase} | Spawned for: ${item.firstAcquiredBy} (District ${item.firstAcquiredDistrict})`);
      console.log(`   • Current Status: ${item.currentHolderStatus.toUpperCase()} (Held by: ${item.currentHolderName || "None"})`);
      console.log(`   • Custody Timeline:`);

      for (let idx = 0; idx < item.history.length; idx++) {
        const h = item.history[idx];
        const isLast = idx === item.history.length - 1;
        const branch = isLast ? "└──" : "├──";
        const actionEmoji =
          h.action === "SPAWNED"
            ? "🌱"
            : h.action === "LOOTED"
            ? "⚔️"
            : h.action === "CONSUMED"
            ? "🩹"
            : h.action === "LOST"
            ? "💨"
            : h.action === "CARRIED_TO_END"
            ? "👑"
            : "📦";

        const phaseTag = `[Phase #${h.phaseOrder} | Day ${h.dayNumber} ${h.phaseType.toUpperCase()}]`;
        console.log(`      ${branch} ${actionEmoji} ${phaseTag} ${h.action}: ${h.tributeName} (D${h.district}) — ${h.details}`);
      }
    }
  }

  // Print Section 3: Tribute Inventories & Dossiers
  console.log(`\n=======================================================`);
  console.log(` 👤 3. TRIBUTE INVENTORY & LOOTING DOSSIERS`);
  console.log(`=======================================================`);

  // Sort tributes: Victor first, then by placement or kills
  const sortedTributes = Array.from(tributeSummaries.values())
    .filter((t) => (!tributeFilter ? true : t.name.toLowerCase().includes(tributeFilter)))
    .sort((a, b) => {
      if (a.placement === 1) return -1;
      if (b.placement === 1) return 1;
      return (a.placement ?? 99) - (b.placement ?? 99);
    });

  for (const t of sortedTributes) {
    const isVictor = t.placement === 1;
    const titleBadge = isVictor ? "👑 VICTOR" : t.status === "dead" ? `💀 Fallen (#${t.placement})` : "Alive";

    console.log(`\n• ${t.name} (District ${t.district}) — ${titleBadge}`);
    console.log(`   Kills: ${t.kills} | Acquired: ${t.itemsAcquiredCount} | Looted: ${t.itemsLootedCount} | Consumed: ${t.itemsConsumedCount}`);

    if (t.finalInventory.length > 0) {
      console.log(`   Final Gear (${t.finalInventory.length} items):`);
      for (const itemName of t.finalInventory) {
        const cat = inferCategory(itemName);
        const icon = getCategoryIcon(cat);
        console.log(`      ${icon} ${itemName}`);
      }
    } else {
      console.log(`   Final Gear: None (Empty)`);
    }
  }

  // Print Section 4: Deadliest Weapon Analysis
  console.log(`\n=======================================================`);
  console.log(` ⚔️ 4. WEAPON PERFORMANCE & FATALITY TELEMETRY`);
  console.log(`=======================================================`);

  // Weapons held by top killers
  const topKillers = sortedTributes.filter((t) => t.kills > 0).slice(0, 5);
  for (const killer of topKillers) {
    console.log(`   • ${killer.name} (District ${killer.district}) — ${killer.kills} confirmed kill(s):`);
    const weapons = killer.finalInventory.filter((name) => inferCategory(name) === "weapon");
    if (weapons.length > 0) {
      for (const w of weapons) {
        console.log(`      🗡️ ${w}`);
      }
    } else {
      console.log(`      (Unarmed at conclusion)`);
    }
  }

  console.log(`\n=======================================================`);
  console.log(` 🏆 ITEM HISTORY REPORT COMPLETE`);
  console.log(`=======================================================\n`);
}

runItemHistoryTracker().catch((err) => {
  console.error("❌ Fatal error executing item history tracker:", err);
  process.exit(1);
});
