import puppeteer from "puppeteer";
import cheerio from "cheerio";
import cache from "memory-cache";

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
  });

  const asciiCode = String.fromCharCode(8594); // Define asciiCode here

  const textArray = await Promise.all(textPromises);
  const withoutBackToArticles = textArray
    .filter((text) => typeof text === "string") // Filter out non-string values
    .filter((text) => text.trim() !== "Back to Articles")
    .map((text) => text.trim());

  const cleanedText = withoutBackToArticles.map((text) => {
    if (text) {
      return text.replace(new RegExp(asciiCode, "g"), "");
    } else {
      return "";
    }
  });

  return cleanedText.join(" ").trim();
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

export {scrapeWebsite,getPagesInfo,extractText,parsePages,findHrefs,parseSinglePage,countWords};