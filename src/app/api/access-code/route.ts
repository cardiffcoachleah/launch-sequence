import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { action, code, name, email, transition_type } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // VALIDATE: check if code is valid and unused
    if (action === "validate") {
      const { data, error } = await supabase
        .from("access_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return NextResponse.json({ valid: false, message: "That code doesn't look right. Check for typos and try again." });
      }

      if (data.used_by) {
        return NextResponse.json({ valid: false, message: "This code has already been used. Request a new one below." });
      }

      // Mark code as used with their actual email
      await supabase
        .from("access_codes")
        .update({ used_by: email?.trim() || "unknown", used_at: new Date().toISOString() })
        .eq("id", data.id);

      return NextResponse.json({ valid: true });
    }

    // REQUEST: send notification email via Resend
    if (action === "request") {
      if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
      }

      // Send notification to Leah
      const notifyRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Launch Sequence <noreply@launchsequence.io>",
          to: "leah@leahfarmer.com",
          subject: `Access code request: ${name}`,
          html: `
            <p><strong>${name}</strong> has requested a Launch Sequence access code.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Transition type:</strong> ${transition_type || "Not specified"}</p>
            <p>Reply to this email to send them a code from your Supabase access_codes table.</p>
          `,
          reply_to: email,
        }),
      });

      if (!notifyRes.ok) {
        console.error("Failed to send notification email");
      }

      // Send confirmation to requester
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Leah Farmer <noreply@launchsequence.io>",
          to: email,
          subject: "Your Launch Sequence plan is saved",
          html: `
            <p>Hi ${name},</p>
            <p>Your T-10 plan has been saved. You can return to it anytime by clicking the link in the separate magic link email you just received.</p>
            <p>I'll review your access code request and send your code within 24 hours. Once you have it, enter it on the plan page to unlock the full 90-day plan.</p>
            <p>Leah</p>
            <p style="font-size:12px;color:#666;">Questions? Email leah@leahfarmer.com</p>
          `,
        }),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Access code error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
