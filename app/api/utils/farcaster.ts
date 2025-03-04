import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      max_tokens: 100,
      temperature: 0.9,
    });

    return response.choices[0].message?.content?.trim() || "Error: No response generated.";
  } catch (error) {
    console.error("Error generating rumor:", error);
    return "A strange silence fills the air... maybe that's the real story.";
  }
}

export async function postReplyToFarcaster(replyText: string, originalCastId: string) {
  const url = "https://api.neynar.com/v2/farcaster/cast";
  const apiKey = process.env.NEYNAR_API_KEY;
  const signerUUID = process.env.NEYNAR_SIGNER_UUID;

  if (!apiKey || !signerUUID) {
    console.error("Missing Neynar API Key or Signer UUID!");
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