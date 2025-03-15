import OpenAI from "openai";
import axios from "axios";
import { TwitterApi } from "twitter-api-v2";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
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

    const castHash = response.data.cast.hash;
    const castFid = response.data.cast.fid;
    const username = await fetchUsernameFromFid(castFid);
    const castUrl = `https://warpcast.com/${username}/${castHash}`;

    return { castUrl, responseData: response.data };
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
    const username = await fetchUsernameFromFid(castFid);
    const castUrl = `https://warpcast.com/${username}/${castHash}`;

    return { castUrl, responseData: response.data };
  } catch (error) {
    console.error("❌ Error posting new cast to Farcaster:", error.response?.data || error.message);
    throw error;
  }
}

export async function fetchUsernameFromFid(fid: number): Promise<string> {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing Neynar API Key!");
    return "rumournews.eth"; // Fallback
  }

  try {
    const response = await axios.get(`https://api.neynar.com/v2/farcaster/user?fid=${fid}`, {
      headers: { "x-api-key": apiKey },
    });

    if (response.data && response.data.result && response.data.result.user) {
      return response.data.result.user.username || "rumournews.eth"; 
    }

    return "rumournews.eth";
  } catch (error) {
    console.error("❌ Error fetching username:", error.response?.data || error.message);
    return "rumournews.eth"; // Fallback
  }
}


function extractHeadline(text: string): string {
  return text.split("\n")[0]; 
}

export async function postToTwitter(tweetText: string, castUrl: string) {
  try {
    const headline = extractHeadline(tweetText); 
    const fullTweet = `${headline} \n\n🔗 ${castUrl}`;
    console.log("🚀 Posting to X (Twitter):", fullTweet);

    const rwClient = twitterClient.readWrite;
    const { data } = await rwClient.v2.tweet(fullTweet);

    console.log("✅ Successfully posted to Twitter:", data);
    return data;
  } catch (error) {
    console.error("❌ Error posting to X (Twitter):", error);
    throw error;
  }
}

export async function processCastAndPost(messageText: string, originalCastId: { hash: string; fid: number }) {
  try {
    const rumor = await generateSatiricalRumor(messageText);

 
    const replyData = await postReplyToFarcaster(rumor, originalCastId.hash);


    const quoteData = await postNewCastWithEmbed(rumor, originalCastId);

    console.log("⏳ Waiting 30 seconds before posting to X (Twitter)...");


    setTimeout(async () => {
      try {
        await postToTwitter(rumor, quoteData.castUrl);
        console.log("✅ Done! Posted only the cast link and headline to Twitter.");
      } catch (error) {
        console.error("❌ Error posting to Twitter after delay:", error);
      }
    }, 30000); 

  } catch (error) {
    console.error("❌ Error in processing and posting:", error);
  }
}
