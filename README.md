# PitchSlapped - AI Shark Tank Pitch Simulator

**Think you've got what it takes? Pitch your startup to a panel of ruthless AI investors and find out.**

PitchSlapped drops you into a high-pressure Shark Tank-style pitch room where three AI investor personas — James, Vidya, and Layla — grill you on your startup idea in real time. After your pitch, you receive an AI-generated report scoring your performance across five key dimensions.

Built at **HackDavis 2026**.

## Features

- **Live AI Investor Panel** — Three distinct investor personas with unique voices and personalities powered by ElevenLabs Conversational AI
- **Real-Time Audio-Visual Sync** — Character-level alignment synchronizes judge avatar highlights with audio playback at millisecond precision
- **AI Pitch Analysis** — Post-pitch scoring across Clarity, Persuasion, Market Knowledge, Confidence, and Financials using Google Gemini
- **Immersive UI** — Dark Shark Tank aesthetic with spotlight animations, concentric ring effects on active speakers, and color-coded live transcripts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Backend | Express 5 (Node.js) |
| Voice AI | ElevenLabs Conversational AI (WebSocket) |
| Analysis | Google Gemini 2.0 Flash |
| Hosting | Vultr Cloud Compute |
| Domain | GoDaddy Registry |

## Architecture

```
User speaks into mic
       |
       v
ElevenLabs Conversational AI (WebSocket)
  - 3 investor personas with distinct voice IDs
  - Real-time streaming audio + alignment data
       |
       v
React Frontend (PitchRoom)
  - Parses speaker tags (<James>, <Vidya>, <Layla>)
  - Builds character-level alignment timeline
  - Syncs judge avatar highlights with audio playback
  - Captures full transcript
       |
       v
Express Backend (/analyze-pitch)
  - Sends transcript to Gemini 2.0 Flash
  - Returns structured scores + feedback
       |
       v
React Frontend (PitchReport)
  - Displays conic-gradient score chart
  - Shows verdict, strengths, improvements
```

## Getting Started

### Prerequisites
- Node.js 18+
- ElevenLabs API key + configured Conversational AI agent
- Google Gemini API key

### Setup

```bash
git clone https://github.com/blanklavender/pitch-slapped.git
cd pitch-slapped
npm install
```

Create a `.env` file in the project root:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
GEMINI_API_KEY=your_gemini_api_key
```

### Run

Start the backend and frontend:

```bash
# Terminal 1 - Backend
node server/index.js

# Terminal 2 - Frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

1. **Prep Room** — Read the rules and mentally prepare your pitch
2. **Pitch Room** — Deliver your pitch live to three AI investors who interrupt with tough questions
3. **Pitch Report** — Receive your AI-generated scorecard with detailed feedback

## Scoring Dimensions

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Clarity | 20 pts | How well you articulated your idea |
| Persuasion | 20 pts | Your ability to convince investors |
| Market Knowledge | 20 pts | Understanding of your target market |
| Confidence | 20 pts | Poise and conviction in delivery |
| Financials | 20 pts | Grasp of business model and numbers |

## Team

Built with no sleep and lots of determination at HackDavis 2026.

## License

MIT
