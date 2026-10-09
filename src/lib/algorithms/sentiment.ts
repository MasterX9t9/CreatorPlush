import { MetricAttribution } from "@/lib/types";

export interface CommentInput {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface SentimentAnalysisResult {
  sampleCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  sentimentScore: number; // -100 to +100
  topThemes: string[];
  viewerRequests: string[];
  commonQuestions: string[];
  formula: string;
  attribution: MetricAttribution;
}

const POSITIVE_WORDS = new Set([
  "great", "amazing", "awesome", "excellent", "love", "loved", "best", "helpful",
  "informative", "thanks", "thank", "appreciate", "brilliant", "fantastic", "good",
  "cool", "masterpiece", "valuable", "super", "fire", "incredible", "favorite",
  "clean", "genius", "inspiring", "perfect", "enjoyed", "clarity", "useful", "recommend"
]);

const NEGATIVE_WORDS = new Set([
  "bad", "terrible", "worst", "awful", "boring", "disappointing", "waste", "clickbait",
  "confusing", "wrong", "fake", "hate", "useless", "annoying", "poor", "unhelpful",
  "disagree", "horrible", "outdated", "misleading", "audio", "trash", "cringe"
]);

const REQUEST_PATTERNS = [
  /please (?:make|do|cover|show|explain)\b/i,
  /can you (?:make|do|cover|show|review|do a tutorial)\b/i,
  /could you (?:make|do|cover|show)\b/i,
  /next video (?:should be|on)\b/i,
  /would love (?:to see|a video on|part 2)\b/i,
  /part 2\b/i,
  /tutorial on\b/i,
];

const QUESTION_PATTERNS = [
  /^(?:how|why|what|when|where|who|is there|can|could|would|does|do)\b/i,
  /\?$/,
];

/**
 * Heuristic & lexical sentiment analyzer designed for YouTube creator feedback.
 * Analyzes comment valence, viewer requests, and inquiries.
 */
export function analyzeCommentSentiment(comments: CommentInput[]): SentimentAnalysisResult {
  if (comments.length === 0) {
    return {
      sampleCount: 0,
      positivePct: 0,
      neutralPct: 0,
      negativePct: 0,
      sentimentScore: 0,
      topThemes: [],
      viewerRequests: [],
      commonQuestions: [],
      formula: "positivePct = (pos / total) * 100, negativePct = (neg / total) * 100",
      attribution: {
        source: "internal_calculation",
        dataType: "calculated",
        timestamp: new Date().toISOString(),
        confidence: 0.9,
      },
    };
  }

  let posCount = 0;
  let negCount = 0;
  let neutralCount = 0;

  const viewerRequests: string[] = [];
  const commonQuestions: string[] = [];
  const wordFrequency: Record<string, number> = {};

  const stopwords = new Set([
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "is", "are", "was", "were", "it", "this", "that", "i", "you", "my",
    "your", "we", "they", "video", "youtube", "from", "as", "just", "very", "so"
  ]);

  comments.forEach((c) => {
    const text = c.text.trim();
    if (!text) return;

    // Check for viewer requests
    if (REQUEST_PATTERNS.some((pattern) => pattern.test(text))) {
      if (viewerRequests.length < 5 && !viewerRequests.includes(text)) {
        viewerRequests.push(text);
      }
    }

    // Check for questions
    if (QUESTION_PATTERNS.some((pattern) => pattern.test(text))) {
      if (commonQuestions.length < 5 && !commonQuestions.includes(text)) {
        commonQuestions.push(text);
      }
    }

    // Tokenize
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    let commentPos = 0;
    let commentNeg = 0;

    tokens.forEach((word) => {
      if (POSITIVE_WORDS.has(word)) commentPos++;
      if (NEGATIVE_WORDS.has(word)) commentNeg++;

      if (!stopwords.has(word) && !POSITIVE_WORDS.has(word) && !NEGATIVE_WORDS.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    if (commentPos > commentNeg) {
      posCount++;
    } else if (commentNeg > commentPos) {
      negCount++;
    } else {
      neutralCount++;
    }
  });

  const total = comments.length;
  const positivePct = Math.round((posCount / total) * 100);
  const negativePct = Math.round((negCount / total) * 100);
  const neutralPct = Math.max(0, 100 - positivePct - negativePct);

  // Sentiment score between -100 and +100
  const sentimentScore = Math.round(((posCount - negCount) / total) * 100);

  // Extract top themes by recurring non-stopword tokens
  const topThemes = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  return {
    sampleCount: total,
    positivePct,
    neutralPct,
    negativePct,
    sentimentScore,
    topThemes,
    viewerRequests,
    commonQuestions,
    formula: "sentimentScore = ((pos - neg) / sampleCount) * 100",
    attribution: {
      source: "internal_calculation",
      dataType: "calculated",
      timestamp: new Date().toISOString(),
      confidence: 0.88,
    },
  };
}
