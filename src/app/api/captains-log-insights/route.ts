import { NextResponse } from "next/server";

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { entries } = await req.json();

    if (!entries || entries.length < 3) {
      return NextResponse.json({ error: "Need at least 3 entries" }, { status: 400 });
    }

    // Format entries for the prompt
    const formattedEntries = entries
      .slice(0, 30) // cap at 30 to keep prompt reasonable
      .map((e: { phase: string; entry: string; created_at: string; action_title?: string }, i: number) => {
        const date = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const context = e.action_title ? `[Action note: ${e.action_title}]` : `[${e.phase}]`;
        return `Entry ${i + 1} (${date}) ${context}:\n${e.entry}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are an executive coach analyzing a leader's private journal entries from their professional transition. Your job is to identify meaningful patterns and themes across their entries and surface insights they may not have noticed themselves.

WHAT MAKES A GOOD INSIGHT:
- Specific, not generic. "You mention feeling uncertain about your manager's expectations" not "You are adjusting to a new environment."
- Honest and direct. Name what you see, even if it is uncomfortable.
- Grounded in the actual content of the entries. Quote or paraphrase specific things they wrote.
- Actionable where possible — end observations with a question or reframe that might open something up.

WHAT TO LOOK FOR:
- Recurring themes, people, challenges, or emotions across multiple entries
- Things they mention repeatedly that suggest a pattern
- Gaps or contradictions — things they say they want to do but never follow up on
- Energy shifts — where do they seem energized vs. drained
- Things they may be avoiding or minimizing
- Wins they are not fully acknowledging

RULES:
- 3-5 insights maximum. Fewer is better if the patterns are not strong.
- Each insight needs a short theme title (3-5 words), a specific observation (2-4 sentences), and the number of entries it appeared in.
- The summary should be 2-3 sentences giving the overall picture of where this person is in their transition.
- Do not use em dashes or en dashes.
- Do not use the words "genuinely," "honestly," or "straightforward."
- Do not be sycophantic. These are private notes, not a performance review.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overall picture of where this person is.",
  "insights": [
    {
      "theme": "Short theme title",
      "observation": "2-4 sentences grounded in what they actually wrote.",
      "entries_referenced": 3
    }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: `Analyze these journal entries from a leader in transition:\n\n${formattedEntries}` }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    const result = await response.json();
    const text = result.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
