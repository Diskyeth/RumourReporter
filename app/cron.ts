
import fs from "fs";
import path from "path";


const FILE_PATH = path.resolve("replied_casts.json");

let repliedCasts = new Set<string>();
if (fs.existsSync(FILE_PATH)) {
  const data = fs.readFileSync(FILE_PATH, "utf-8");
  repliedCasts = new Set(JSON.parse(data));
}

console.log("⏳ Cron job disabled as webhook handles real-time processing.");
