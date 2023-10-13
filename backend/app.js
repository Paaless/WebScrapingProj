import express from "express";
import axios from "axios";
import puppeteer from "puppeteer";
import cheerio from "cheerio";

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server Listening on PORT:", 3000);
  
});

app.get("/standard_fetch", async (request, response) => {
  try{
  const content = await scrapeWebsite("https://wsa-test.vercel.app/");
  const data = await findHrefs(content);
  const objects = await parsePages(data);
  //response.json(objects);
  const parsed_response = objects.map(item =>({
    title:item.title,
    short_description:item.description,
  }));
  
  
  response.json(parsed_response)
  console.log(parsed_response);
  }catch(error){
    console.error(error);
  }
});

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

async function getPageInfo() {}

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
