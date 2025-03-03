import { NextResponse } from "next/server";
import OpenAI from "openai";
import axios from "axios";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Function to generate a satirical rumor
async function generateSatiricalRumor(messageText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a sarcastic news reporter..." },
        { role: "user", content: `Turn this into a satirical headline: "${messageText}"` }
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    return response.choices[0].message?.content?.trim() || "Error: No response generated.";
  } catch (error) {
    console.error("❌ Error generating satire rumor:", error);
    return "BREAKING: Satire AI refuses to generate a rumor.";
  }
}

// ✅ Function to fetch messages from Neynar API
async function fetchNewMessages() {
  const url = "https://hub-api.neynar.com/v1/castsByFid?fid=884230&pageSize=5&reverse=true";
  const apiKey = process.env.NEYNAR_API_KEY;

  try {
    const response = await axios.get(url, {
      headers: { "Accept": "application/json", "x-api-key": apiKey },
    });

    return response.data.messages?.map((msg: any) => ({
      type: msg.data.type,
      fid: msg.data.fid,
      timestamp: msg.data.timestamp,
      network: msg.data.network,
      hash: msg.hash,
      signer: msg.signer,
      text: msg.data.castAddBody?.text || "",
      embeds: msg.data.castAddBody?.embeds || [],
    })) || [];
  } catch (error) {
    console.error("❌ Error fetching messages:", error.response?.data || error.message);
    return [];
  }
}

// ✅ Function to post a reply to Neynar Farcaster API
async function postReplyToFarcaster(replyText: string, originalCastId: string) {
  const url = "https://api.neynar.com/v2/farcaster/cast";
  const apiKey = process.env.NEYNAR_API_KEY;
  const signerUUID = process.env.NEYNAR_SIGNER_UUID;

  if (!apiKey || !signerUUID) {
    console.error("❌ Missing Neynar API Key or Signer UUID!");
    throw new Error("Missing NEYNAR_API_KEY or NEYNAR_SIGNER_UUID in environment variables.");
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
export { fetchNewMessages };
