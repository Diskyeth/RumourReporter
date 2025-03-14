import OpenAI from "openai";
import axios from "axios";
import { TwitterApi } from "twitter-api-v2";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use OAuth 2.0 Bearer Token
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || "");

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
        text: newCastText,
        signer_uuid: signerUUID,
        embeds: [{ cast_id: originalCastId }],
      },
      {
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      }
    );

    const castHash = response.data.cast.hash;
    const castFid = response.data.cast.fid;
    const castUrl = `https://warpcast.com/${castFid}/${castHash}`;

    return { castUrl, responseData: response.data };
  } catch (error) {
    console.error("❌ Error posting new cast to Farcaster:", error.response?.data || error.message);
    throw error;
  }
}

export async function postToTwitter(tweetText: string, castUrl: string) {
  try {
    const fullTweet = `${tweetText} \n\n🔗 ${castUrl}`;
    console.log("🚀 Attempting to post to X:", fullTweet);

    const rwClient = twitterClient.readWrite;
    const { data } = await rwClient.v2.tweet(fullTweet);
    
    console.log("✅ Successfully posted to X (Twitter):", data);
    return data;
  } catch (error) {
    console.error("❌ Error posting to X (Twitter):", error);
    
    if (error instanceof Error) {
      console.error("❌ Error Message:", error.message);
    }

    if (error?.response?.data) {
      console.error("❌ X (Twitter) API Response:", JSON.stringify(error.response.data, null, 2));
    }

    throw error;
  }
}
