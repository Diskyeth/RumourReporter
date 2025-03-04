import { NextResponse } from "next/server";
import { generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Webhook received:", body);

    const { data } = body;
    if (!data || !data.castAddBody) {
      console.error("❌ Invalid webhook payload:", body);
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.castAddBody.text;
    const originalCastId = data.hash;

    console.log("📝 Received cast:", messageText);

    // ✅ Respond immediately to Neynar to prevent timeout
    setImmediate(async () => {
      try {
        const replyText = await generateSatiricalRumor(messageText);
        await postReplyToFarcaster(replyText, originalCastId);
        console.log("✅ Reply posted:", replyText);
      } catch (err) {
        console.error("❌ Error processing cast:", err);
      }
    });

    return NextResponse.json({ message: "Processing in background" });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
