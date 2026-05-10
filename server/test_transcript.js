import dotenv from "dotenv";
import { GoogleGenAI  } from "@google/genai";

dotenv.config();

const genai = new GoogleGenAI(process.env.GEMINI_API_KEY);

const mockTranscript = [
  { role: "system", text: "Connected. The investors are listening — start your pitch." },
  { role: "user", text: "Hi everyone, I'm Alex and I'm here to pitch BrewBot — a smart coffee machine that learns your taste preferences over time using AI. We're seeking 200 thousand dollars for 10% equity." },
  { role: "agent", text: "<James>Interesting concept. How does the AI actually learn? Is it just tracking what buttons I press, or is there something deeper going on?</James>" },
  { role: "user", text: "Great question James. BrewBot uses a combination of direct feedback — you rate each cup — and passive signals like time of day, weather, and how quickly you finish your drink. Our proprietary algorithm adjusts grind size, water temperature, and brew time." },
  { role: "agent", text: "<Vidya>I like the tech angle, but coffee machines are a crowded market. What makes you different from a Nespresso with an app?</Vidya>" },
  { role: "user", text: "Vidya, the key difference is we don't use pods. We work with fresh beans, and our machine grinds and brews. No proprietary pod lock-in. Plus our AI genuinely adapts — Nespresso just gives you preset options." },
  { role: "agent", text: "<Layla>Talk to me about numbers. What's your current revenue? What's the unit economics look like?</Layla>" },
  { role: "user", text: "We launched 6 months ago. We've done 450 thousand in revenue. Each unit costs us 180 to manufacture, we sell at 499. Our customer acquisition cost is about 45 dollars through social media and influencer partnerships." },
  { role: "agent", text: "<James>Those margins are solid. What's your return rate?</James>" },
  { role: "user", text: "Return rate is 3.2%, which is well below industry average of 8% for kitchen appliances. Our NPS score is 72." },
  { role: "agent", text: "<Vidya>What's your plan for the 200K? Where does that money go?</Vidya>" },
  { role: "user", text: "60% goes to inventory for our next production run — we're supply constrained right now. 25% to marketing to scale our influencer program. And 15% to R&D for our mobile app which launches in Q3." },
  { role: "agent", text: "<Layla>I have concerns about scalability. Manufacturing hardware is capital intensive. How do you plan to scale without burning through cash?</Layla>" },
  { role: "user", text: "We've partnered with a contract manufacturer in Shenzhen who can scale to 50,000 units per month. We only pay per unit, so there's no fixed overhead increase. We're also exploring a subscription model for premium bean deliveries which would give us recurring revenue." },
  { role: "agent", text: "<James>I like what I'm hearing. The subscription angle is smart. I'd be interested in making an offer.</James><Vidya>I think the market is tough but you clearly know your numbers. I'm going to pass, but I wish you the best.</Vidya><Layla>I love the recurring revenue angle. I'm in — I'd like to make an offer as well.</Layla>" },
];

async function test() {
  const conversationText = mockTranscript
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

  console.log("Sending to Gemini...\n");
  // const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await genai.models.generateContent({
        model: "gemma-3-27b-it",
        contents: prompt,
  });
  const text = result.text;
  console.log("Raw response:\n", text, "\n");

  const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
  const analysis = JSON.parse(cleaned);
  console.log("Parsed analysis:\n", JSON.stringify(analysis, null, 2));
}

test().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
