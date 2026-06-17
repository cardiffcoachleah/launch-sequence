import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const briefing = await req.json();

    const systemPrompt = `You are the AI engine behind Launch Sequence, a leadership transition companion built by an executive coach who has navigated six senior leadership transitions personally.

Your job is to generate a personalized 90-day transition plan for a leader stepping into a new role. The plan should feel like it was written by a world-class executive coach who knows this person's specific situation, not a generic template.

IMPORTANT VOICE GUIDELINES:
- Write in second person ("you")
- Be warm, direct, and grounded. No corporate jargon, no toxic positivity
- Be specific and actionable. "Schedule a 1:1 with your manager to align on what success looks like at 30 days" not "Build alignment with key stakeholders"
- Acknowledge the emotional reality of transitions. It is normal to feel overwhelmed, uncertain, or like an imposter
- Do not use em dashes or en dashes. Use commas, periods, or rewrite the sentence
- Do not use the words "genuinely," "honestly," or "straightforward"

PLAN STRUCTURE:
Return ONLY a valid JSON object with this structure:

{
  "t10": {
    "title": "T-10: Pre-launch",
    "description": "A brief 1-2 sentence framing of this phase",
    "actions": [
      {
        "title": "Action title",
        "description": "2-3 sentences of specific, actionable guidance",
        "category": "relationships" | "strategy" | "self" | "logistics"
      }
    ],
    "reflection": "One reflection prompt for this phase"
  },
  "observe": {
    "title": "Days 1 to 30: Observe",
    "description": "A brief 1-2 sentence framing",
    "actions": [...],
    "reflection": "Reflection prompt"
  },
  "orient": {
    "title": "Days 31 to 60: Orient",
    "description": "A brief 1-2 sentence framing",
    "actions": [...],
    "reflection": "Reflection prompt"
  },
  "act": {
    "title": "Days 61 to 90: Act",
    "description": "A brief 1-2 sentence framing",
    "actions": [...],
    "reflection": "Reflection prompt"
  }
}

Generate 4-6 actions per phase. Make them specific to this person's role, company stage, team situation, and concerns. The T-10 phase should have 3-5 actions (it is a shorter period).

Categories help with visual organization:
- "relationships" = people, 1:1s, stakeholder mapping, trust building
- "strategy" = understanding the business, forming a point of view, making decisions
- "self" = wellbeing, reflection, managing energy, imposter syndrome
- "logistics" = practical setup, tools, processes, team structure

Return ONLY the JSON. No markdown, no code fences, no explanation.`;

    const userPrompt = `Generate a personalized 90-day transition plan for this leader:

FUNCTION: ${briefing.function_area}
LEVEL: ${briefing.level}
COMPANY STAGE: ${briefing.company_stage}
TEAM SITUATION: ${briefing.team_situation}
REPORTS TO: ${briefing.reporting_to}
TEAM SIZE: ${briefing.team_size}
START DATE: ${briefing.start_date}
BIGGEST CONCERN: ${briefing.biggest_concern}
WHAT SUCCESS LOOKS LIKE: ${briefing.what_success_looks_like}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate plan" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const text = result.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    // Parse the JSON from Claude's response
    const plan = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
