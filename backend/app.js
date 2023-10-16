import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import cache from "memory-cache";
import { parseSentimentText } from "./sentiment.js";
import cors from "cors";

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
        const slug = request.headers.slug;
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

async function countWords(text) {
  const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_'`~()?]/g, "").split(/\s+/);
  const filteredWords = words.filter((word) => word !== "");
  const wordCount = filteredWords.length;
  return wordCount;
}

async function parseSinglePage(page) {
  try {
    const pageContent = await scrapeWebsite(page);
    const $ = cheerio.load(pageContent);
    const scriptElement = $("script#__NEXT_DATA__");

    if (scriptElement.length > 0) {
      const scriptContent = scriptElement.html();

      try {
        const jsonData = JSON.parse(scriptContent);
        const extractedData = jsonData.props.pageProps.post;
        return extractedData;
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      console.error("Script element not found");
    }
  } catch (error) {
    console.error(error);
  }
}

async function parsePages(pages) {
  try {
    const dataArray = [];
    for (const [key, value] of Object.entries(pages)) {
      const website = "https://wsa-test.vercel.app" + value;
      const pageContent = await scrapeWebsite(website);
      const $ = cheerio.load(pageContent);
      const scriptElement = $("script#__NEXT_DATA__");

      if (scriptElement.length > 0) {
        const scriptContent = scriptElement.html();

        try {
          const jsonData = JSON.parse(scriptContent);
          const extractedData = jsonData.props.pageProps.post;
          dataArray.push(extractedData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      } else {
        console.error("Script element not found");
      }
    }
    return dataArray;
  } catch (error) {
    console.error("Error", error);
  }
}

async function findHrefs(html) {
  try {
    const $ = cheerio.load(html);
    const objects = {};
    $('a[href^="/blog/"]').each((index, element) => {
      const href = $(element).attr("href");
      const key = href.split("/blog/")[1];
      objects[key] = href;
    });
    return objects;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function extractText(element, $) {
  const textPromises = element.contents().map(async function () {
    if (this.type === "text") {
      return $(this).text();
    } else if (this.type === "tag") {
      return extractText($(this), $);
    }
    ```
    const withoutBackToArticles = allText.map((text) => {
      return text.replace(/ Back to Articles /, "").trim();
    });
    const cleanedText = withoutBackToArticles.map((text) => {
      return text.replace(new RegExp(asciiCode, "g"), "");
    });
    ```
  });

  const textArray = await Promise.all(textPromises);
  return textArray.join(" ").trim();
}


async function getPagesInfo(pages) {
  try {
    const allTextArray = [];
    for (const [key, value] of Object.entries(pages)) {
      const website = "https://wsa-test.vercel.app" + value;
      const pageContent = await scrapeWebsite(website);
      const $ = cheerio.load(pageContent);
      const allTextPromise = extractText($("html"), $);
      allTextArray.push(allTextPromise);
    }

    const allText = await Promise.all(allTextArray);
    const asciiCode = String.fromCharCode(8594);
    const withoutBackToArticles = allText.map((text) => {
      return text.replace(/ Back to Articles /, "").trim();
    });
    const cleanedText = withoutBackToArticles.map((text) => {
      return text.replace(new RegExp(asciiCode, "g"), "");
    });
    return cleanedText;
  } catch (error) {
    console.error(error);
  }
}

async function scrapeWebsite(website) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(website);
    await page.waitForTimeout(3000);
    const pageContent = await page.content();
    await browser.close();
    return pageContent;
  } catch (error) {
    console.error("Error:", error);
  }
}
