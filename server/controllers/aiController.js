const { stripHtml } = require('../utils/sanitizeHtml');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

// Gemini's free tier has a real per-minute request limit, and every call
// costs quota even on the free tier, so we cap how much content we send
// and rely on express-rate-limit on each route to prevent abuse.
const MAX_CONTENT_CHARS = 6000;

// Shared helper -- every AI feature in this file (summarize, title/tags,
// rewrite) sends one prompt and gets one text response back, so they all
// go through this single function instead of duplicating the fetch logic.
const callGemini = async (prompt, maxOutputTokens = 500) => {
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Gemini API error:', response.status, errBody);
    throw new Error('GEMINI_REQUEST_FAILED');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error('GEMINI_EMPTY_RESPONSE');
  }

  return text;
};

const summarizePost = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI summarization is not configured on this server',
      });
    }

    const { content, title } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required to summarize' });
    }

    const plainText = stripHtml(content).slice(0, MAX_CONTENT_CHARS);

    const prompt = `Summarize the following blog post in exactly 3 concise lines. Each line should be a complete sentence. Do not use bullet points, numbering, or markdown formatting -- just 3 plain lines separated by newlines.\n\nTitle: ${title || 'Untitled'}\n\nContent:\n${plainText}`;

    let summaryText;
    try {
      summaryText = await callGemini(prompt, 500);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'Failed to generate summary. Please try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      data: { summary: summaryText },
    });
  } catch (err) {
    next(err);
  }
};

const generateTitleTags = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI features are not configured on this server' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required to generate titles and tags' });
    }

    const plainText = stripHtml(content).slice(0, MAX_CONTENT_CHARS);

    const prompt = `You are helping a blogger title and tag their post. Based on the content below, respond with ONLY valid JSON in this exact shape, nothing else -- no markdown fences, no explanation:
{"titles": ["title one", "title two", "title three"], "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}

Rules:
- Provide exactly 3 titles: catchy, under 70 characters each, no clickbait punctuation like "!!!" 
- Provide exactly 5 tags: lowercase, single words or short phrases, relevant for SEO discovery, no "#" symbol
- Base everything strictly on the content provided, don't invent unrelated topics

Content:
${plainText}`;

    let raw;
    try {
      raw = await callGemini(prompt, 400);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'Failed to generate titles and tags. Please try again.' });
    }

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse Gemini JSON response:', cleaned);
      return res.status(502).json({ success: false, message: 'AI response was not in the expected format. Please try again.' });
    }

    const titles = Array.isArray(parsed.titles) ? parsed.titles.slice(0, 3) : [];
    const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map((t) => String(t).toLowerCase().trim()) : [];

    if (titles.length === 0 || tags.length === 0) {
      return res.status(502).json({ success: false, message: 'AI did not return usable titles or tags. Please try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'Titles and tags generated successfully',
      data: { titles, tags },
    });
  } catch (err) {
    next(err);
  }
};

const REWRITE_MODES = {
  grammar: 'Fix all grammar, spelling, and punctuation mistakes in the following text. Do not change the meaning, tone, or style otherwise -- only correct errors.',
  professional: 'Rewrite the following text in a more professional, polished tone suitable for a business or technical blog audience. Keep the same core meaning and roughly the same length.',
  simple: 'Rewrite the following text in simple, plain English that is easy for a beginner to understand. Avoid jargon and complex sentence structures. Keep the same core meaning.',
};

const rewriteText = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI features are not configured on this server' });
    }

    const { text, mode } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required to rewrite' });
    }
    if (!REWRITE_MODES[mode]) {
      return res.status(400).json({ success: false, message: 'Invalid rewrite mode' });
    }

    const plainText = text.slice(0, MAX_CONTENT_CHARS);

    const prompt = `${REWRITE_MODES[mode]} Respond with ONLY the rewritten text, no preamble, no explanation, no quotation marks around it.\n\nText:\n${plainText}`;

    let rewritten;
    try {
      rewritten = await callGemini(prompt, 800);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'Failed to rewrite text. Please try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'Text rewritten successfully',
      data: { rewritten },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { summarizePost, generateTitleTags, rewriteText };