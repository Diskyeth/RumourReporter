import OpenAI from "openai";
import axios from "axios";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate prompt
export async function generateSatiricalRumor(messageText: string): Promise<string> {
    try {
      const systemPrompt = process.env.PROMPT_SYSTEM || "Default system prompt.";
      const userPrompt = process.env.PROMPT_USER || "Default user prompt: ";
  
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt} "${messageText}"` }
        ],
        max_tokens: 70,
        temperature: 0.9,
      });
  
      return response.choices[0].message?.content?.trim() || "Error: No response generated.";
    } catch (error) {
      console.error("Error generating rumour:", error);
      return "A strange silence fills the air... maybe that's the real story.";
    }
  }
  

// Fetch Casts
export async function fetchNewMessages() {
  const url = "https://api.neynar.com/v2/farcaster/feed/user/casts?fid=884230&viewer_fid=1013079&limit=1&include_replies=false";
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
    console.error("Error fetching messages:", error.response?.data || error.message);
    return [];
  }
}

// ✅ Function to post a reply to Neynar Farcaster API
export async function postReplyToFarcaster(replyText: string, originalCastId: string) {
  const url = "https://api.neynar.com/v2/farcaster/cast";
  const apiKey = process.env.NEYNAR_API_KEY;
  const signerUUID = process.env.NEYNAR_SIGNER_UUID;

  if (!apiKey || !signerUUID) {
    console.error("Missing Neynar API Key or Signer UUID!");
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
