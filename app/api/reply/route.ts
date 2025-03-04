import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { generateSatiricalRumor, postReplyToFarcaster, postQuoteCastToFarcaster } from "../utils/farcaster";

const WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("X-Neynar-Signature");

    if (!signature) {
      console.error("❌ Missing Neynar signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!WEBHOOK_SECRET) {
      console.error("❌ Missing webhook secret in environment");
      return NextResponse.json({ error: "Webhook secret is not set" }, { status: 500 });
    }

    const hmac = createHmac("sha512", WEBHOOK_SECRET);
    hmac.update(body);
    const computedSignature = hmac.digest("hex");

    if (computedSignature !== signature) {
      console.error("❌ Invalid signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    if (!data || !data.data || data.type !== "cast.created" || !data.data.hash) {
      console.error("❌ Invalid webhook payload:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.data.text || "No text found";
    const originalCastId = data.data.hash;
    const originalFid = data.data.fid;

    console.log("📝 Received cast:", messageText);

    setImmediate(async () => {
      try {
        const replyText = await generateSatiricalRumor(messageText);
        console.log("🤖 Generated reply:", replyText);

        // Reply to the cast
        await postReplyToFarcaster(replyText, originalCastId);
        console.log("✅ Reply posted successfully");

        // Quotecast the cast
        const quoteText = `🤔 Interesting take! What do you think?`;
        await postQuoteCastToFarcaster(quoteText, originalCastId, originalFid);
        console.log("✅ Quotecast posted successfully");
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
