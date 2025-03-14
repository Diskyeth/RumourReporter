require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function postTestTweet() {
  try {
    const rwClient = twitterClient.readWrite;
    const { data } = await rwClient.v2.tweet("🚀 Hello Twitter! This is a test tweet from my bot.");
    console.log("✅ Successfully posted to Twitter:", data);
  } catch (error) {
    console.error("❌ Error posting to Twitter:", error);
  }
}

postTestTweet();
