# PitchSlapped -- AI Shark Tank

An AI-powered pitch practice platform where users pitch their startup ideas to a panel of AI investor personas. Claude plays multiple investor roles (skeptical VC, impact investor, technical founder) and grills you with tough questions -- just like a real Shark Tank. The AI remembers your previous pitches using Backboard, so it can track how your idea evolves over time.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Express (Node.js)
- **AI:** Claude API (multi-turn conversations + investor personas)
- **Memory:** Backboard (persistent pitch history)
- **Speech-to-Text:** ElevenLabs
- **Deployment:** Vultr

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd pitch-slapped
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   ```

4. **Start the backend server:**
   ```bash
   node server/index.js
   ```
   This runs on `http://localhost:3001`.

5. **In a separate terminal, start the frontend:**
   ```bash
   npm run dev
   ```
   This runs on `http://localhost:5173`.

6. Open `http://localhost:5173` in your browser.
