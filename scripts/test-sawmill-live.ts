/**
 * Live OpenRouter Comprehensive World Generation Test for Sawmill Complex
 * Generates:
 * 1. Cornucopia description
 * 2. One item for each rarity (Common, Uncommon, Rare, Legendary)
 * 3. One weapon for each rarity (Common, Uncommon, Rare, Legendary)
 * 4. 2 NPCs (Hostiles)
 * 5. 1 Arena Feast
 * 6. 1 Arena Cataclysm
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateText } from "ai";
import { getStorytellingModel } from "../src/lib/ai";

// 1. Load .env.local
function loadEnv() {
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

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY in environment.");
  process.exit(1);
}

const arenaName = "Sawmill Complex";
const arenaDescription =
  "An massive industrial logging site, evyrthing is made wood, sawdust scatters all over the place, massive logs are everyhere on the ground, stacked in silos, or hanging by ropes attchd the sealing, most building are several stories high with opne windows.On the ground moving saws are prsent, unknow is their purpose.";

async function generateFullArenaContent() {
  console.log("==================================================");
  console.log("CALLING OPENROUTER TO GENERATE COMPLETE ARENA CONTENT");
  console.log("==================================================");
  console.log("Arena:", arenaName);
  console.log("Description:", arenaDescription);
  console.log("");

  const model = getStorytellingModel(undefined, apiKey);

  const systemPrompt = `You are the lead Gamemaker architect and worldbuilder of the Hunger Games.
Your job is to generate a comprehensive, highly atmospheric, cinematic set of arena assets tailored 100% to the user's custom arena description.
Everything must feel authentic to the lore, sensory, and visceral.

Return your response as a valid, well-formatted JSON object with this exact structure:
{
  "cornucopiaDescription": "1-2 evocative sentences describing the central Cornucopia horn and tribute launch pedestals in this arena.",
  "items": {
    "common": { "name": "Item Name", "category": "sustenance|tool|medical|armor", "description": "1 sentence description" },
    "uncommon": { "name": "Item Name", "category": "sustenance|tool|medical|armor", "description": "1 sentence description" },
    "rare": { "name": "Item Name", "category": "sustenance|tool|medical|armor", "description": "1 sentence description" },
    "legendary": { "name": "Item Name", "category": "sustenance|tool|medical|armor", "description": "1 sentence description" }
  },
  "weapons": {
    "common": { "name": "Weapon Name", "description": "1 sentence description" },
    "uncommon": { "name": "Weapon Name", "description": "1 sentence description" },
    "rare": { "name": "Weapon Name", "description": "1 sentence description" },
    "legendary": { "name": "Weapon Name", "description": "1 sentence description" }
  },
  "npcs": [
    { "name": "NPC 1 Name", "description": "1-2 sentences describing appearance and behavior" },
    { "name": "NPC 2 Name", "description": "1-2 sentences describing appearance and behavior" }
  ],
  "feast": {
    "title": "Feast Title",
    "description": "2-3 sentences describing the Feast setting, where supplies appear in the arena, and the high-stakes hazards around it"
  },
  "cataclysm": {
    "title": "Cataclysm Title",
    "hazardType": "short_type_tag",
    "description": "2-3 sentences describing an arena-wide catastrophic Gamemaker disaster using the specific features of the arena"
  }
}

Do NOT wrap in markdown codeblocks (no \`\`\`json). Output pure raw JSON only.`;

  const userPrompt = `Arena Name: ${arenaName}
Arena Description: ${arenaDescription}

Generate the complete arena content suite now.`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxRetries: 2,
    timeout: 30000,
  });

  const raw = result.text.trim();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    const data = JSON.parse(cleaned);
    console.log("### 1. CORNUCOPIA DESCRIPTION");
    console.log(data.cornucopiaDescription);
    console.log("");

    console.log("### 2. ONE ITEM FOR EACH RARITY");
    console.log(`• COMMON (${data.items.common.category}): **${data.items.common.name}** — ${data.items.common.description}`);
    console.log(`• UNCOMMON (${data.items.uncommon.category}): **${data.items.uncommon.name}** — ${data.items.uncommon.description}`);
    console.log(`• RARE (${data.items.rare.category}): **${data.items.rare.name}** — ${data.items.rare.description}`);
    console.log(`• LEGENDARY (${data.items.legendary.category}): **${data.items.legendary.name}** — ${data.items.legendary.description}`);
    console.log("");

    console.log("### 3. ONE WEAPON FOR EACH RARITY");
    console.log(`• COMMON: **${data.weapons.common.name}** — ${data.weapons.common.description}`);
    console.log(`• UNCOMMON: **${data.weapons.uncommon.name}** — ${data.weapons.uncommon.description}`);
    console.log(`• RARE: **${data.weapons.rare.name}** — ${data.weapons.rare.description}`);
    console.log(`• LEGENDARY: **${data.weapons.legendary.name}** — ${data.weapons.legendary.description}`);
    console.log("");

    console.log("### 4. TWO THEMED ARENA NPCS");
    data.npcs.forEach((npc: { name: string; description: string }, idx: number) => {
      console.log(`• NPC #${idx + 1}: **${npc.name}**`);
      console.log(`  ${npc.description}`);
    });
    console.log("");

    console.log("### 5. ARENA FEAST");
    console.log(`**${data.feast.title}**`);
    console.log(data.feast.description);
    console.log("");

    console.log("### 6. ARENA CATACLYSM");
    console.log(`**${data.cataclysm.title}** (Hazard Type: ${data.cataclysm.hazardType})`);
    console.log(data.cataclysm.description);
    console.log("");
    console.log("==================================================");
    console.log("ALL 6 ARENA ELEMENTS GENERATED SUCCESSFULLY VIA LIVE LLM");
    console.log("==================================================");
  } catch (parseErr) {
    console.error("Failed to parse JSON response:", parseErr);
    console.log("Raw output was:");
    console.log(raw);
  }
}

generateFullArenaContent().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
