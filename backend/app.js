import express from "express";
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import cache from "memory-cache";
import { parseSentimentText } from "./sentiment.js";

const app = express();
app.use(express.json());
const myCache = new cache.Cache();

app.listen(3000, () => {
  console.log("Server Listening on PORT:", 3000);
  
});

app.get("/short_desc", async (request, response) => {
  try {
    // Check if the data is already cached
    const cachedData = myCache.get("objects");

    if (cachedData) {
      // If data is cached, use it
      const parsed_response = cachedData.map((item) => ({
        title: item.title,
        short_description: item.description,
      }));

      response.json(parsed_response);
      console.log(parsed_response);
    } else {
      // If data isn't cached, load and store it
      const content = await scrapeWebsite("https://wsa-test.vercel.app/");
      const data = await findHrefs(content);
      const objects = await parsePages(data);

      // Store the data in the cache with a specific expiration time (e.g., 10 minutes)
      myCache.put("objects", objects, 600000); // 600,000 milliseconds = 10 minutes

      const parsed_response = objects.map((item) => ({
        title: item.title,
        short_description: item.description,
      }));

      response.json(parsed_response);
      console.log(parsed_response);
    }
  } catch (error) {
    console.error(error);
  }
});
app.get("/sentiment", async(request,response)=>{
  try{
    const {url} = request.query;

    if(!url){
      response.status(400).json({error: "URL parameter is required"});
      return;
    }

  }catch(error){
    console.error(error);
  }
});
app.get("/long_desc", async (request, response) => {
  try {
    const websiteUrl = "https://wsa-test.vercel.app";
    
    // Check if the data is already cached
    const cachedData = myCache.get("longDescData");
    
    if (cachedData) {
      response.json(cachedData);
      console.log(cachedData);
    } else {
      // Fetch the content and process it
      const content = await scrapeWebsite(websiteUrl);
      const data = await findHrefs(content);
      const objects = await parsePages(data);
      const text = await getPageInfo(data);
      
      // Ensure all promises are resolved and synchronized
      const sentimentPromises = objects.map(async (item, index) => ({
        title: item.title,
        short_description: item.description,
        sentiment: await parseSentimentText(text[index]),
        image: {
          src: websiteUrl+item.image.src,
          width:item.image.width,
          height:item.image.height,
        },
        href: websiteUrl+"/blog/"+item.slug,
        word_count : await countWords(text[index]),
      }));
    
      // Await all sentiment promises and get the resolved values
      const parsed_response = await Promise.all(sentimentPromises);
    
      // Store the processed data in the cache with an expiration time
      myCache.put("longDescData", parsed_response, 600000); // 600,000 milliseconds = 10 minutes
    
      response.json(parsed_response); // Return the extracted text as JSON
      console.log(parsed_response);
    }
  } catch (error) {
    console.error(error);
  }
});

async function countWords(text){
  
  const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_'`~()?]/g, '').split(/\s+/);

  const filteredWords = words.filter(word => word !== '');

  const wordCount = filteredWords.length;

  return wordCount;
}
async function parsePages(pages) {
  try {
    const dataArray = [];
    for (const [key, value] of Object.entries(pages)) {
      const website = "https://wsa-test.vercel.app" + value;
      const pageContent = await scrapeWebsite(website);
      // Load the HTML into Cheerio
      const $ = cheerio.load(pageContent);

      // Find the script element with id="__NEXT_DATA__"
      const scriptElement = $("script#__NEXT_DATA__");

      if (scriptElement.length > 0) {
        // Extract the content of the script element
        const scriptContent = scriptElement.html();

        // Parse the script content as JSON
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
function extractText(element, $) {
  let text = "";
  element.contents().each(function () {
    if (this.type === "text") {
      text += $(this).text() + " ";
    } else if (this.type === "tag") {
      text += extractText($(this), $) + " "; // Pass $ as an argument
    }
  });
  return text.trim();
}

async function getPageInfo(pages) {
  try {
    const allTextArray = []; // Array to store extracted text from all pages
    for (const [key, value] of Object.entries(pages)) {
      const website = "https://wsa-test.vercel.app" + value;
      const pageContent = await scrapeWebsite(website);

      // Load the HTML into Cheerio
      const $ = cheerio.load(pageContent);

      const allTextPromise = extractText($("html"), $);
      allTextArray.push(allTextPromise);
    }

    // Await all promises and get the resolved values
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

    // Navigate to the target website
    await page.goto(website);

    // Wait for some time to ensure the content is loaded
    await page.waitForTimeout(3000);

    // Get HTML content
    const pageContent = await page.content();

    await browser.close();

    return pageContent;
  } catch (error) {
    console.error("Error:", error);
  }
}
