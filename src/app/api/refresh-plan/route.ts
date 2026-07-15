import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { context, phase, briefing, existing_plan } = await req.json();

    const phaseLabels: Record<string, string> = {
      t10: "T-10 Pre-launch",
      observe: "Days 1 to 30 Observe",
      orient: "Days 31 to 60 Orient",
      act: "Days 61 to 90 Act",
    };

    const existingActions = (existing_plan?.[phase]?.actions || [])
      .map((a: { title: string }, i: number) => `${i + 1}. ${a.title}`)
      .join("\n");

    const systemPrompt = `You are the AI engine behind Launch Sequence, a leadership transition companion.

Your job is to generate 2-4 new, targeted action items to add to an existing transition plan. The user has learned something new that their current plan does not address.

RULES:
- Generate actions that are SPECIFIC to the new context the user described
- Do NOT duplicate or closely overlap with the existing actions listed
- Actions should be immediately actionable, not vague
- Match the voice: second person, warm, direct, no em dashes, no toxic positivity
- Each action needs a title, description (2-3 sentences), and category

Category must be exactly one of: "relationships", "strategy", "self", "logistics"

Return ONLY valid JSON, no markdown, no explanation:
{
  "new_actions": [
    {
      "title": "Action title",
      "description": "2-3 sentences of specific, actionable guidance.",
      "category": "relationships"
    }
  ]
}`;

    const userPrompt = `A leader in transition needs new actions added to their ${phaseLabels[phase] || phase} phase.

THEIR ORIGINAL CONTEXT:
- Function: ${briefing.function_area}
- Level: ${briefing.level}
- Transition type: ${briefing.transition_type}
- Company stage: ${briefing.company_stage}
- Team situation: ${briefing.team_situation}

WHAT IS ALREADY IN THIS PHASE:
${existingActions || "No existing actions"}

WHAT THEY HAVE LEARNED / WHAT HAS CHANGED:
${context}

Generate 2-4 new actions that directly address what has changed. Do not repeat existing actions.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "API error", detail: err }, { status: 500 });
    }

    const result = await response.json();
    const text = result.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Add actions error:", error);
    return NextResponse.json({ error: "Failed to generate actions" }, { status: 500 });
  }
}
