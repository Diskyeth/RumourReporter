require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function testTwitterAuth() {
  try {
    const account = await twitterClient.v2.me();
    console.log("✅ Twitter API Authentication Successful!", account);
  } catch (error) {
    console.error("❌ Twitter API Authentication Failed!", error);
  }
}

testTwitterAuth();
