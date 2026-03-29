import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, duration } = await req.json();

  if (![5, 10, 15, 20].includes(duration)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const topicContext = topic
    ? `Focus the prompts and scripture around this topic or verse: "${topic}".`
    : "Use general themes appropriate for a well-rounded prayer time.";

  const prompt = `You are a prayer guide helping someone through a ${duration}-minute prayer session using the ACTS model (Adoration, Confession, Thanksgiving, Supplication).

${topicContext}

For each of the 4 phases, provide:
1. A relevant scripture verse (book chapter:verse format, with the actual text of the verse)
2. A 2-3 sentence prayer prompt that guides the person in that phase

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "adoration": {
    "scripture": "Psalm 95:6-7 - Come, let us bow down in worship, let us kneel before the Lord our Maker; for he is our God and we are the people of his pasture, the flock under his care.",
    "prompt": "Take a moment to praise God for who He is. Reflect on His greatness, His faithfulness, and His love. Let your heart overflow with worship."
  },
  "confession": {
    "scripture": "1 John 1:9 - If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.",
    "prompt": "Bring before God anything weighing on your heart. He already knows, and He is ready to forgive. Speak honestly and receive His grace."
  },
  "thanksgiving": {
    "scripture": "Psalm 107:1 - Give thanks to the Lord, for he is good; his love endures forever.",
    "prompt": "Think about what God has done in your life recently. Name specific blessings - big or small. Let gratitude fill your prayer time."
  },
  "supplication": {
    "scripture": "Philippians 4:6 - Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    "prompt": "Bring your needs and the needs of others before God. Pray for those on your heart. Trust that He hears every word."
  }
}

Use different scripture each time. Make the prompts warm, encouraging, and faith-filled.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    let text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if present
    text = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate session prompts. Please try again." },
      { status: 500 }
    );
  }
}
