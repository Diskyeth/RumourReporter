import { NextResponse } from "next/server";
import { fetchNewMessages, generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster"; // ✅ Import from utils
// ✅ API Route Handler - GET: Fetch & Reply to New Casts
export async function GET() {
  try {
    console.log("🔄 Checking for new casts...");

    const casts = await fetchNewMessages();
    if (casts.length === 0) {
      console.log("⚠️ No new casts found.");
      return NextResponse.json({ message: "No new casts found" });
    }

    for (const cast of casts) {
      if (cast.type === "MESSAGE_TYPE_CAST_ADD") {
        console.log(`📝 New cast from signer ${cast.signer}: "${cast.text}"`);

        // Generate a satirical rumor
        const satireRumor = await generateSatiricalRumor(cast.text);

        // Post reply to Farcaster
        await postReplyToFarcaster(satireRumor, cast.hash);
      }
    }

    return NextResponse.json({ message: "Satirical replies sent!" });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ API Route Handler - POST: Manually Reply to a Cast
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageText, castId, userFid } = body;

    if (!messageText || !castId || !userFid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const satireRumor = await generateSatiricalRumor(messageText);
    const farcasterResponse = await postReplyToFarcaster(satireRumor, castId);

    return NextResponse.json({ reply: satireRumor, farcasterResponse }, { status: 200 });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
