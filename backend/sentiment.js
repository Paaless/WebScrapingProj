import vader from 'vader-sentiment';

const interpretSentiment = (score) => {
  if (score >= 4) return "Strongly Positive";
  if (score > 0) return "Positive";
  if (score === 0) return "Neutral";
  if (score > -4) return "Negative";
  return "Strongly Negative";
};

const parseSentimentText = (text) => {
  const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  console.log("Result is : "+result.compound);
  const humanReadable = interpretSentiment(result.compound);
  console.log("Human readable result is: "+ humanReadable);
  return humanReadable;
};

export { parseSentimentText };
