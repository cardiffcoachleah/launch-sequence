import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { change_type, change_description, changed_action, phase, full_plan } = await req.json();

    // Flatten all actions from all phases for context
    const allActions: string[] = [];
    const phaseKeys = ["t10", "observe", "orient", "act"];
    for (const p of phaseKeys) {
      const phaseData = full_plan?.[p];
      if (phaseData?.actions) {
        phaseData.actions.forEach((a: { title: string }, i: number) => {
          allActions.push(`[${p}:${i}] ${a.title}`);
        });
      }
    }

    const systemPrompt = `You are an executive coaching assistant reviewing a leadership transition plan for ripple effects.

When a leader edits or adds something to their transition plan, other items in the plan may need to be reconsidered. Your job is to identify 1-3 specific existing actions that might be affected by the change — not to rewrite them, just to flag them for the user's attention.

The actions are listed with their phase prefix in square brackets: [t10], [observe], [orient], or [act].

RULES:
- Only flag items that are genuinely connected to the change. If nothing is clearly affected, return an empty array.
- Be specific — use the exact action title from the list.
- Include the phase key exactly as it appears in the prefix (t10, observe, orient, or act).
- Keep each note to one sentence explaining WHY it might be affected.
- Maximum 3 items. Fewer is better if the connection is weak.
- Do not flag the changed item itself.
- Do not use em dashes. No toxic positivity.

Return ONLY valid JSON:
{
  "ripples": [
    {
      "action_title": "Exact title of the affected action",
      "phase": "observe",
      "reason": "One sentence explaining the connection."
    }
  ]
}`;

    const userPrompt = `A leader just made a change to their transition plan.

CHANGE TYPE: ${change_type === "edit" ? "Edited an existing action" : "Added new actions"}
PHASE: ${phase}
WHAT CHANGED: ${change_description}
${changed_action ? `SPECIFIC ACTION CHANGED: ${changed_action}` : ""}

ALL ACTIONS IN THEIR PLAN:
${allActions.join("\n")}

Identify 1-3 existing actions (not the changed one) that might need to be reconsidered in light of this change. If nothing is clearly connected, return an empty ripples array.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ ripples: [] });
    }

    const result = await response.json();
    const text = result.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    // Ripple check is non-critical — fail silently
    return NextResponse.json({ ripples: [] });
  }
}
