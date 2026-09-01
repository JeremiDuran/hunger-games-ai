/**
 * Hunger Games AI — Automated Anonymous Guest User Cleanup Script
 * 
 * Purges expired/stale anonymous guest sessions and their cascaded database records
 * from Supabase Auth & public tables.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-anonymous-users.ts
 *   npx tsx scripts/cleanup-anonymous-users.ts --hours=24
 *   npx tsx scripts/cleanup-anonymous-users.ts --hours=1
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// 1. Load environment variables from .env.local
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jeremiduran17@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Parse CLI Arguments
const args = process.argv.slice(2);
let hoursThreshold = 24; // Default: 24 hours (typical guest token TTL)

for (const arg of args) {
  if (arg.startsWith("--hours=")) {
    const parsed = parseInt(arg.split("=")[1], 10);
    if (!isNaN(parsed) && parsed >= 0) {
      hoursThreshold = parsed;
    }
  }
}

async function runCleanup() {
  console.log("\n=======================================================");
  console.log(" 🏛️  PANEM CAPITOL DIRECTIVE: ANONYMOUS GUEST PURGE");
  console.log("=======================================================");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error("❌ Error: Missing ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  console.log(`📡 Connecting to Supabase Gateway: ${SUPABASE_URL}`);
  console.log(`⏳ Expiration Threshold: Older than ${hoursThreshold} hour(s)`);
  console.log(`👤 Authenticating as Head Gamemaker (${ADMIN_EMAIL})...\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 2. Sign in as Admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error("❌ Authentication Failed:", authError?.message || "Invalid credentials");
    process.exit(1);
  }

  console.log(`✅ Authentication Successful! User ID: ${authData.user.id}`);

  // 3. Call cleanup stored procedure
  const intervalParam = `${hoursThreshold} hours`;
  console.log(`🧹 Executing cleanup RPC with threshold: "${intervalParam}"...`);

  const { data: result, error: rpcError } = await supabase.rpc("cleanup_stale_anonymous_users", {
    p_older_than: intervalParam,
  });

  if (rpcError) {
    console.error("❌ RPC Execution Failed:", rpcError.message);
    process.exit(1);
  }

  // 4. Report Results
  const output = Array.isArray(result) && result.length > 0 ? result[0] : { deleted_count: 0, deleted_user_ids: [] };
  const count = output.deleted_count ?? 0;
  const ids: string[] = output.deleted_user_ids ?? [];

  console.log("\n-------------------------------------------------------");
  console.log(`🎯 Cleanup Complete:`);
  console.log(`   • Anonymous Accounts Purged: ${count}`);
  if (ids.length > 0) {
    console.log(`   • Purged User UUIDs:`);
    ids.forEach((id, idx) => console.log(`     [${idx + 1}] ${id}`));
  } else {
    console.log(`   • No stale anonymous sessions met the ${hoursThreshold}h threshold.`);
  }
  console.log("-------------------------------------------------------\n");

  // Sign out cleanly
  await supabase.auth.signOut();
  console.log("🔒 Admin session safely terminated.\n");
}

runCleanup().catch((err) => {
  console.error("💥 Fatal error during cleanup:", err);
  process.exit(1);
});
