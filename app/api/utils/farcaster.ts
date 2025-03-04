import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TEXT_LENGTH = 1024; // Farcaster's character limit

/**
 * Truncates text to ensure it is within the required length.
 */
function truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (Buffer.byteLength(text, "utf-8") > maxLength) {
    return text.slice(0, maxLength - 3) + "..."; // Add ellipsis if truncated
  }
  return text;
}

/**
 * Generates a satirical rumor based on the input cast text.
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

    const generatedText = response.choices[0].message?.content?.trim() || "Error: No response generated.";
    return truncateText(generatedText); // Ensure the reply fits within Farcaster limits
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
    const truncatedText = truncateText(replyText); // Ensure text length is valid

    const response = await axios.post(
      url,
      {
        text: truncatedText,
        parent: originalCastId,
        signer_uuid: signerUUID,
      },
      {
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      }
    );

    console.log("✅ Reply posted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error posting reply to Farcaster:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Posts a quotecast that embeds the original cast.
 */

export async function postQuoteCastToFarcaster(quoteText: string, originalCastId: string) {
    const url = "https://api.neynar.com/v2/farcaster/cast";
    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUUID = process.env.NEYNAR_SIGNER_UUID;
  
    if (!apiKey || !signerUUID) {
      console.error("❌ Missing Neynar API Key or Signer UUID!");
      throw new Error("Missing NEYNAR_API_KEY or NEYNAR_SIGNER_UUID in environment variables.");
    }
  
    try {
      const truncatedText = truncateText(quoteText); // Ensure text length is valid
  
      const response = await axios.post(
        url,
        {
          text: truncatedText,
          embeds: [
            {
              cast: { castId: originalCastId }, // ✅ Correctly formatted object
            },
          ],
          signer_uuid: signerUUID,
        },
        {
          headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        }
      );
  
      console.log("✅ Quotecast posted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error posting quotecast to Farcaster:", error.response?.data || error.message);
      throw error;
    }
  }
  
  
  
  