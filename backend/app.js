import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import cheerio from "cheerio";
import cache from "memory-cache";
import cors from "cors";
import {scrapeWebsite,getPagesInfo,extractText,parsePages,findHrefs,parseSinglePage,countWords} from "./utils.js"
import { parseSentimentText } from "./sentiment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());

const myCache = new cache.Cache();

app.listen(3000, () => {
  console.log("Server Listening on PORT:", 3000);
});

app.use(express.static(__dirname));

app.get("/api", async (request, response) => {
  try {
    const { link, type } = request.query;

    if (!link || !type) {
      return response
        .status(400)
        .json({ error: "Link and type parameters are required" });
    }

    switch (type) {
      case "short_desc":
        const cachedData = myCache.get("objects");
        if (cachedData) {
          const parsed_response = cachedData.map((item) => ({
            title: item.title,
            short_description: item.description,
          }));
          response.json(parsed_response);
        } else {
          const content = await scrapeWebsite(link);
          const data = await findHrefs(content);
          const objects = await parsePages(data);
          myCache.put("objects", objects, 600000); // 600,000 milliseconds = 10 minutes
          const parsed_response = objects.map((item) => ({
            title: item.title,
            short_description: item.description,
          }));
          console.log(parsed_response);
          response.json(parsed_response);
        }
        break;

      case "sentiment":
        const slug = link
        const url = `https://wsa-test.vercel.app/blog/${slug}`;

        if (!slug) {
          response.status(400).json({ error: "Slug parameter is required" });
          return;
        }

        const cachedDataSentiment = myCache.get("longDescData");

        if (cachedDataSentiment) {
          const matchingData = cachedDataSentiment.find(
            (data) => data.slug === slug
          );

          if (matchingData) {
            const result = {
              sentiment: matchingData.sentiment,
            };
            console.log(result);
            response.json(result);
          } else {
            const text = await scrapeWebsite(url);
            const sentiment_value = await parseSentimentText(text);
            const result = {
              sentiment: sentiment_value,
            };
            console.log(result);
            response.json(result);
          }
        } else {
          const text = await scrapeWebsite(url);
          const sentiment_value = await parseSentimentText(text);
          const result = {
            sentiment: sentiment_value,
          };
          response.json(result);
        }
        break;

      case "long_desc":
        const websiteUrl = link;

        const cachedDataLongDesc = myCache.get("longDescData");

        if (cachedDataLongDesc) {
          console.log(cachedDataLongDesc);
          response.json(cachedDataLongDesc);
        } else {
          const content = await scrapeWebsite(websiteUrl);
          const data = await findHrefs(content);
          const objects = await parsePages(data);

          const textPromises = Object.values(data).map(async (item) => {
            const website = "https://wsa-test.vercel.app" + item;
            const pageContent = await scrapeWebsite(website);
            const $ = cheerio.load(pageContent);
            return extractText($("html"), $);
          });
          
          const text = await Promise.all(textPromises);
          
          console.log(text);
          const sentimentPromises = objects.map(async (item, index) => ({
            title: item.title,
            short_description: item.description,
            sentiment: await parseSentimentText(text[index]),
            image: {
              src: websiteUrl + item.image.src,
              width: item.image.width,
              height: item.image.height,
            },
            href: websiteUrl + "/blog/" + item.slug,
            slug: item.slug,
            word_count: await countWords(text[index]),
          }));

          const parsed_response = await Promise.all(sentimentPromises);

          myCache.put("longDescData", parsed_response, 600000);
          console.log(parsed_response);
          response.json(parsed_response);
        }
        break;

      default:
        response.status(400).json({ error: "Invalid type parameter" });
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

