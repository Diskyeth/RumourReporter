import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a satirical rumor based on the input text using OpenAI.
 */
export async function generateSatiricalRumor(messageText: string): Promise<string> {
  try {
    const systemPrompt = process.env.PROMPT_SYSTEM || "Default system prompt.";
    const userPrompt = process.env.PROMPT_USER || "Default user prompt: ";

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt} "${messageText}"` },
      ],
      max_tokens: 125,
      temperature: 0.9,
    });

    return response.choices[0].message?.content?.trim() || "Error: No response generated.";
  } catch (error) {
    console.error("❌ Error generating rumor:", error);
    return "A strange silence fills the air... maybe that's the real story.";
  }
}

/**
 * Posts a reply to a Farcaster cast.
 */
export async function postReplyToFarcaster(replyText: string, originalCastId: string) {
  const url = "https://api.neynar.com/v2/farcaster/cast";
  const apiKey = process.env.NEYNAR_API_KEY;
  const signerUUID = process.env.NEYNAR_SIGNER_UUID;

  if (!apiKey || !signerUUID) {
    console.error("❌ Missing Neynar API Key or Signer UUID!");
    throw new Error("Missing NEYNAR_API_KEY or NEYNAR_SIGNER_UUID in environment variables.");
  }

  try {
    const response = await axios.post(
      url,
      {
        text: replyText,
        parent: originalCastId,
        signer_uuid: signerUUID,
      },
      {
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error posting reply to Farcaster:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Posts a new cast with an embedded original cast.
 */
export async function postNewCastWithEmbed(newCastText: string, originalCastId: { hash: string; fid: number }) {
    const url = "https://api.neynar.com/v2/farcaster/cast";
    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUUID = process.env.NEYNAR_SIGNER_UUID;
  
    if (!apiKey || !signerUUID) {
      console.error("❌ Missing Neynar API Key or Signer UUID!");
      throw new Error("Missing NEYNAR_API_KEY or NEYNAR_SIGNER_UUID in environment variables.");
    }
  
    try {
      const response = await axios.post(
        url,
        {
          text: newCastText, // The new generated rumor
          signer_uuid: signerUUID, // The bot's signer ID
          embeds: [
            {
              cast_id: originalCastId, // ✅ Correct: Sending cast_id as an object with hash & fid
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        }
      );
  
      return response.data;
    } catch (error) {
      console.error("❌ Error posting new cast to Farcaster:", error.response?.data || error.message);
      throw error;
    }
  }
  
  
  
  