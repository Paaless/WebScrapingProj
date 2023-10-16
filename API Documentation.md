API Documentation
Introduction
This API serves as a backend for various operations related to web scraping and sentiment analysis. It provides endpoints for extracting information from web pages, analyzing sentiment in text, and caching the results for improved performance.

Prerequisites
Node.js installed on the server.
Required Node.js modules installed (express, cheerio, memory-cache, cors, and custom modules utils.js and sentiment.js).
A local development server with CORS enabled (http://127.0.0.1:5500).
API Endpoints
1. Start the Server
URL: http://localhost:3000
Method: GET
Description: This is the base URL where the server is running.
2. Scrape and Extract Data
URL: /api
Method: GET
Description: This endpoint is used to scrape web pages, extract information, and cache the results.
Parameters
link (required): The URL of the web page you want to scrape.
type (required): The type of operation to perform. Options include:
short_desc: Extract short descriptions.
sentiment: Perform sentiment analysis.
long_desc: Extract long descriptions.
Response
If successful, the response will contain the extracted data in JSON format.
If type is short_desc, it will return an array of objects with title and short_description.
If type is sentiment, it will return the sentiment score.
If type is long_desc, it will return an array of detailed objects.
3. Sentiment Analysis
URL: /api
Method: GET
Description: This endpoint performs sentiment analysis on text.
Parameters
link (required): The URL of the web page for sentiment analysis.
Response
If successful, the response will contain the sentiment score as a JSON object.
4. Cache Management
Caching
The API uses an in-memory cache to store previously scraped data. Cached data is stored for 10 minutes (600,000 milliseconds) to improve response time and reduce the load on the target website.

Logging
The API logs events to the console for debugging and monitoring purposes.

Functions
1. countWords(text)
Description: Counts the number of words in a given text.
Parameters:
text (string): The text in which you want to count words.
Returns:
An integer representing the word count.
2. parseSinglePage(page)
Description: Parses data from a single web page using web scraping.
Parameters:
page (string): The URL of the web page to scrape.
Returns:
An object containing the extracted data from the page.
3. parsePages(pages)
Description: Parses data from multiple web pages using web scraping.
Parameters:
pages (object): An object containing URLs of web pages to scrape.
Returns:
An array of objects, each containing extracted data from a different page.
4. findHrefs(html)
Description: Extracts href attributes from anchor elements in HTML.
Parameters:
html (string): The HTML content to search for href attributes.
Returns:
An object where keys are extracted identifiers, and values are corresponding href attributes.
5. extractText(element, $)
Description: Extracts and cleans text content from HTML elements.
Parameters:
element (object): HTML element to extract text from.
$ (object): Cheerio instance.
Returns:
A cleaned text string.
6. getPagesInfo(pages)
Description: Retrieves and processes text content from multiple web pages.
Parameters:
pages (object): An object containing URLs of web pages.
Returns:
An array of cleaned text content from the specified web pages.
7. scrapeWebsite(website)
Description: Scrapes the content of a given web page using Puppeteer.
Parameters:
website (string): The URL of the web page to scrape.
Returns:
The HTML content of the scraped web page.
Error Handling
These functions include error handling to catch and log errors.
Error messages are logged to the console for debugging purposes.
Dependencies
These functions use external libraries and modules, including puppeteer and cheerio, for web scraping and HTML parsing.
The memory-cache library is used for caching scraped data.

Conclusion
This API provides a flexible and efficient way to extract information from web pages and perform sentiment analysis. It uses caching to improve performance and reduce the load on the target websites.