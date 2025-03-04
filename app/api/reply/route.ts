import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { generateSatiricalRumor, postReplyToFarcaster, postNewCastWithEmbed } from "../utils/farcaster";

const WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Read raw request body
    const signature = req.headers.get("X-Neynar-Signature");

    if (!signature) {
      console.error("❌ Missing Neynar signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!WEBHOOK_SECRET) {
      console.error("❌ Missing webhook secret in environment");
      return NextResponse.json({ error: "Webhook secret is not set" }, { status: 500 });
    }

    // Compute HMAC SHA-512 hash
    const hmac = createHmac("sha512", WEBHOOK_SECRET);
    hmac.update(body);
    const computedSignature = hmac.digest("hex");

    console.log("🛠 Expected Signature:", computedSignature);
    console.log("🛠 Received Signature:", signature);

    if (computedSignature !== signature) {
      console.error("❌ Invalid signature! Possible causes: wrong secret, body mismatch.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Convert body back to JSON after verification
    const data = JSON.parse(body);
    console.log("✅ Webhook verified:", JSON.stringify(data, null, 2));

    if (!data || !data.data || data.type !== "cast.created" || !data.data.hash) {
      console.error("❌ Invalid webhook payload:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.data.text || "No text found";
    const originalCastId = data.data.hash;
    const originalCastAuthor = data.data.app?.username || "unknown"; // Get original cast author's username

    console.log("📝 Received cast:", messageText);

    // ✅ Respond immediately to Neynar to prevent timeout
    setImmediate(async () => {
      try {
        const generatedText = await generateSatiricalRumor(messageText);
        console.log("🤖 Generated text:", generatedText);

        // Post reply to original cast
        await postReplyToFarcaster(generatedText, originalCastId);
        console.log("✅ Reply posted successfully");

        // Post new cast with an embed of the original cast
        await postNewCastWithEmbed(generatedText, originalCastId,);
        console.log("✅ New cast with embed posted successfully");

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
