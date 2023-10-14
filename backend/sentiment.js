// Define lists of positive and negative words
const positiveWords = ["good", "great", "awesome", "excellent","beautiful","joyful","pleasant","art","nature","positive vibe"];
const negativeWords = ["bad", "horrible", "terrible","negative" ,"awful","pollution","high cost","overwhelming","junk","issues","waste"];

function parseSentimentText(text) {
  // Convert text to lowercase and split into words
  const words = text.toLowerCase().split(' ');

  // Initialize sentiment scores
  let positiveScore = 0;
  let negativeScore = 0;

  // Analyze each word in the text
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveScore++;
    } else if (negativeWords.includes(word)) {
      negativeScore++;
    }
  });

  // Determine the overall sentiment
  if (positiveScore > negativeScore) {
    return "Positive";
  } else if (negativeScore > positiveScore) {
    return "Negative";
  } else {
    return "Neutral";
  }
}

export {parseSentimentText}

