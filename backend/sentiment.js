import natural from "natural"

const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English",stemmer,"afinn");

function interpretSentiment(score) {
    if (score > 0.5) return "Strongly Positive";
    if (score > 0) return "Positive";
    if (score === 0) return "Neutral";
    if (score > -0.5) return "Negative";
    return "Strongly Negative";
  }


async function parseSentimentText(text){
    console.log(text)
    const result = analyzer.getSentiment(text.split(" "));
    const humanReadable = interpretSentiment(result)
    return humanReadable;
}

export {parseSentimentText}