import { NextResponse } from "next/server";
import { generateSatiricalRumor, postReplyToFarcaster } from "../utils/farcaster";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data } = body;

    if (!data || !data.castAddBody) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const messageText = data.castAddBody.text;
    const originalCastId = data.hash;

    console.log("Received new cast:", messageText);

    // Generate AI response
    const replyText = await generateSatiricalRumor(messageText);

    // Post reply
    await postReplyToFarcaster(replyText, originalCastId);

    return NextResponse.json({ message: "Reply posted successfully!" });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}