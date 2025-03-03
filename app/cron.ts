import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fetchNewCasts, generateReply, postReplyToFarcaster } from "./api/reply/route";

const FILE_PATH = path.resolve("replied_casts.json");

// ✅ Load previous replies from file
let repliedCasts = new Set<string>();
if (fs.existsSync(FILE_PATH)) {
  const data = fs.readFileSync(FILE_PATH, "utf-8");
  repliedCasts = new Set(JSON.parse(data));
}

cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running scheduled job to check for new casts...");

  const casts = await fetchNewCasts();
  if (casts.length === 0) {
    console.log("⚠️ No new casts found.");
    return;
  }

  for (const cast of casts) {
    const { hash, text } = cast;

    if (repliedCasts.has(hash)) {
      console.log(`⏩ Already replied to cast: ${hash}`);
      continue; // ✅ Skip if already replied
    }

    console.log(`📝 New cast detected: "${text}"`);

    const replyText = await generateReply(text);
    await postReplyToFarcaster(replyText, hash);

    repliedCasts.add(hash);
    fs.writeFileSync(FILE_PATH, JSON.stringify(Array.from(repliedCasts)), "utf-8"); // ✅ Save to file
    console.log(`✅ Replied to cast: ${hash}`);
  }

  console.log("✅ Scheduled replies sent.");
});

console.log("⏳ Cron job started, checking for new casts every 5 minutes.");
