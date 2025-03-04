import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Read raw request body
    const signature = req.headers.get("x-neynar-signature");

    if (!signature) {
      console.error("❌ Missing signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Compute HMAC SHA-256 hash (hex encoding)
    const computedHash = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

    console.log("🛠 Expected Signature:", computedHash);
    console.log("🛠 Received Signature:", signature.trim().toLowerCase());

    // Normalize both hashes (trim spaces & convert to lowercase)
    if (computedHash !== signature.trim().toLowerCase()) {
      console.error("❌ Invalid signature! Check webhook secret and payload.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Convert body back to JSON after verification
    const data = JSON.parse(body);
    console.log("✅ Webhook verified:", JSON.stringify(data, null, 2));

    if (!data || !data.data || !data.data.castAddBody) {
      console.error("❌ Invalid webhook payload:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.data.castAddBody.text;
    const originalCastId = data.data.hash;

    console.log("📝 Received cast:", messageText);

    // ✅ Respond immediately to Neynar to prevent timeout
    setImmediate(async () => {
      try {
        const replyText = await generateSatiricalRumor(messageText);
        console.log("🤖 Generated reply:", replyText);
        await postReplyToFarcaster(replyText, originalCastId);
        console.log("✅ Reply posted successfully");
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
