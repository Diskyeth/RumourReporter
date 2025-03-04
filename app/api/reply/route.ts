import { NextResponse } from "next/server";
import { generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster";

export async function POST(req: Request) {
  try {
    const body = await req.text(); // Read raw body for debugging
    console.log("✅ Webhook received raw:", body);

    const parsedBody = JSON.parse(body);
    console.log("✅ Parsed Webhook Body:", parsedBody);

    const { data } = parsedBody;
    if (!data || !data.castAddBody) {
      console.error("❌ Invalid webhook payload:", parsedBody);
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.castAddBody.text;
    const originalCastId = data.hash;

    console.log("📝 Processing Cast:", messageText);

    // Generate AI response
    const replyText = await generateSatiricalRumor(messageText);
    console.log("🤖 AI Generated Reply:", replyText);

    // Post reply
    const response = await postReplyToFarcaster(replyText, originalCastId);
    console.log("✅ Posted Reply:", response);

    return NextResponse.json({ message: "Reply posted successfully!" });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
