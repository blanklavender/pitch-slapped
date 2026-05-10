import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const genai = new GoogleGenAI(process.env.GEMINI_API_KEY);

const app = express();
const PORT = 3001;

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/scribe-token", async (req, res) => {
  try {
    const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
    res.json(token);
  } catch (error) {
    console.error("Token error:", error);
    res.status(500).json({ error: "Failed to get token" });
  }
});

app.get("/signed-url", async (req, res) => {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!agentId) {
      return res.status(500).json({ error: "ELEVENLABS_AGENT_ID not set" });
    }
    const { signedUrl } = await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId,
    });
    res.json({ signedUrl });
  } catch (error) {
    console.error("Signed URL error:", error);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});

app.post("/analyze-pitch", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: "transcript array required" });
    }

    const conversationText = transcript
      .filter((e) => e.role === "user" || e.role === "agent")
      .map((e) => `${e.role === "user" ? "Pitcher" : "Investors"}: ${e.text}`)
      .join("\n");

    const prompt = `You are an expert pitch coach evaluating a startup pitch. Analyze this pitch conversation between a pitcher and investor judges (Shark Tank style).

Return ONLY valid JSON with this exact structure, no markdown, no code fences:
{
  "scores": {
    "clarity": <number 0-20>,
    "persuasion": <number 0-20>,
    "market_knowledge": <number 0-20>,
    "confidence": <number 0-20>,
    "financials": <number 0-20>
  },
  "feedback": "<2-3 sentences of constructive feedback>",
  "verdict": "<e.g. '2 of 3 sharks made an offer' or '0 of 3 sharks made an offer'>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Score each category out of 20. Be fair but critical. Base scores on what the pitcher actually said, not the investors.

Transcript:
${conversationText}`;

    // const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await genai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
    });
    const text = result.text;

    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);
    res.json(analysis);
  } catch (error) {
    console.error("Analyze pitch error:", error);
    res.status(500).json({ error: "Failed to analyze pitch" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
