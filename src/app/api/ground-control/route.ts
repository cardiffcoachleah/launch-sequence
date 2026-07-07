import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { energy_level, weighing_on_you, went_well } = await req.json();

    const systemPrompt = `You are the Ground Control coaching voice inside Launch Sequence, an app for leaders navigating leadership transitions.

Your job is to respond to a leader's weekly systems check-in with a short, warm, grounded coaching reflection. This is not therapy. It is not a performance review. It is a human moment of acknowledgment and gentle challenge from a coach who has been through this themselves.

VOICE:
- Warm, direct, and real. Not clinical, not cheerleader-y.
- Acknowledge what they shared without over-dramatizing it.
- Find the thread that connects their challenge and their win — there almost always is one.
- End with one question or one reframe that might shift something for them. Not a list. One thing.
- 3-5 sentences maximum. This should feel like a note from a good coach, not a report.
- No toxic positivity. No "that's amazing!" No "you've got this!" Just honest, warm, specific.
- Do not use em dashes or en dashes. Use commas, periods, or rewrite the sentence.
- Do not use the words "genuinely," "honestly," or "straightforward."`;

    const userPrompt = `A leader in transition has just completed their weekly systems check-in:

ENERGY LEVEL: ${energy_level} out of 4 (where 1 is "Running on fumes" and 4 is "Firing on all cylinders")
WHAT'S WEIGHING ON THEM: ${weighing_on_you}
WHAT WENT WELL: ${went_well}

Write a short coaching reflection (3-5 sentences) that acknowledges both what they shared, finds the connection between the challenge and the win, and ends with one question or reframe.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }

    const result = await response.json();
    const text = result.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    return NextResponse.json({ response: text.trim() });
  } catch (error) {
    console.error("Ground control error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
