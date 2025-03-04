import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Read raw request body
    const signature = req.headers.get("x-neynar-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Compute HMAC SHA-256 hash
    const hash = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Convert body back to JSON after verification
    const data = JSON.parse(body);
    console.log("✅ Webhook verified:", data);

    if (!data || !data.castAddBody) {
      console.error("❌ Invalid webhook payload:", data);
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
