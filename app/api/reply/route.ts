import { NextResponse } from "next/server";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Export GET request handler
export async function GET() {
  try {
    console.log("🔄 Checking for new casts...");

    const casts = await fetchNewMessages();
    if (casts.length === 0) {
      console.log("⚠️ No new casts found.");
      return NextResponse.json({ message: "No new casts found" });
    }

    return NextResponse.json({ message: "Fetched new casts!", casts });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ Export POST request handler
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

// ✅ Export helper functions
export async function fetchNewMessages() {
  const url = "https://hub-api.neynar.com/v1/castsByFid?fid=884230&pageSize=5&reverse=true";
  const apiKey = process.env.NEYNAR_API_KEY;

  try {
    const response = await axios.get(url, {
      headers: { "Accept": "application/json", "x-api-key": apiKey },
    });

    const messages = response.data.messages || [];
    return messages.map((msg) => ({
      type: msg.data.type,
      hash: msg.hash,
      signer: msg.signer,
      text: msg.data.castAddBody?.text || "",
    })).filter(Boolean);
  } catch (error) {
    console.error("❌ Error fetching messages:", error.response?.data || error.message);
    return [];
  }
}

// ✅ Generate satirical rumors
async function generateSatiricalRumor(messageText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a sarcastic news reporter creating fake breaking news headlines." },
        { role: "user", content: `Turn this into a satirical headline: "${messageText}"` },
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ Error generating satire rumor:", error);
    return "BREAKING: AI refuses to generate satire, causing mass confusion.";
  }
}

// ✅ Post replies to Farcaster
async function postReplyToFarcaster(replyText: string, originalCastId: string) {
  const url = "https://api.neynar.com/v2/farcaster/cast";
  const apiKey = process.env.NEYNAR_API_KEY;
  const signerUUID = process.env.NEYNAR_SIGNER_UUID;

  if (!apiKey || !signerUUID) {
    console.error("❌ Missing API Key or Signer UUID!");
    throw new Error("Missing API credentials.");
  }

  try {
    const response = await axios.post(url, {
      text: replyText,
      parent: originalCastId,
      signer_uuid: signerUUID,
    }, {
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error posting reply to Farcaster:", error.response?.data || error.message);
    throw error;
  }
}
