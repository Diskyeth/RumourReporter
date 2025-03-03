import OpenAI from "openai";
import axios from "axios";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Function to generate a satirical, noir-style rumor response
export async function generateNoirReply(messageText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You're a hard-boiled, cynical newsman in a film noir world. Every rumor is a case waiting to be cracked, every whisper has a grain of truth, and every reply should leave people wondering... just a little." 
        },
        { role: "user", content: `Reply to this rumor with sarcasm and mystery: "${messageText}"` }
      ],
      max_tokens: 150,
      temperature: 0.85,
    });

    return response.choices[0].message?.content?.trim() || "Error: The truth remains elusive.";
  } catch (error) {
    console.error("❌ Error generating noir-style rumor response:", error);
    return "A strange silence fills the air... maybe that's the real story.";
  }
}

// ✅ Function to fetch messages from Neynar API
export async function fetchNewMessages() {
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
export async function postReplyToFarcaster(replyText: string, originalCastId: string) {
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
