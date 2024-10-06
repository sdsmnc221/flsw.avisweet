require("dotenv").config();
const axios = require("axios");
const fs = require("fs").promises;

const FB_GRAPH_API_URL = "https://graph.facebook.com/v21.0";
const { PAGE_ID, APP_ID, APP_SECRET, SHORT_LIVED_ACCESS_TOKEN } = process.env;

async function getAccessToken() {
  try {
    const response = await axios.get(`${FB_GRAPH_API_URL}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: SHORT_LIVED_ACCESS_TOKEN,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function fetchRatings(accessToken) {
  try {
    const response = await axios.get(`${FB_GRAPH_API_URL}/${PAGE_ID}/ratings`, {
      params: {
        access_token: accessToken,
        fields: "rating,created_time,review_text,recommendation_type",
        limit: 100,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching ratings:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function saveToFile(data, filename) {
  try {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
}

async function main() {
  try {
    const accessToken = await getAccessToken();
    console.log("New access token obtained");

    const ratingsData = await fetchRatings(accessToken);
    console.log(`Fetched ${ratingsData.data.length} ratings`);

    // Add page URL and reviews section URL to the data
    ratingsData.page_url = `https://www.facebook.com/${PAGE_ID}`;
    ratingsData.reviews_url = `https://www.facebook.com/${PAGE_ID}/reviews`;

    const filename = `facebook_ratings_${
      new Date().toISOString().split("T")[0]
    }.json`;
    await saveToFile(ratingsData, filename);
  } catch (error) {
    console.error("Main process failed:", error);
  }
}

main();
