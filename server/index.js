import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

dotenv.config();

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

app.get("/conversation-signed-url", async (req, res) => {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!agentId) {
      return res.status(500).json({ error: "ELEVENLABS_AGENT_ID not set" });
    }
    const result = await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId,
    });
    res.json(result);
  } catch (error) {
    console.error("Signed URL error:", error);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});

app.get("/agent-id", (req, res) => {
  res.json({ agentId: process.env.ELEVENLABS_AGENT_ID || null });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
