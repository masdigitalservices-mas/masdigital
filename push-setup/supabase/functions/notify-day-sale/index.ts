// Supabase Edge Function: notify-day-sale
// Triggered by a database webhook on day_sale_report INSERT or UPDATE.
// Sends a web push notification to every subscribed phone.
//
// Secrets required (Supabase Dashboard > Edge Functions > notify-day-sale > Secrets):
//   VAPID_PUBLIC    – public VAPID key (same as in index.html)
//   VAPID_PRIVATE   – private VAPID key (never in the app)
//   VAPID_SUBJECT   – mailto:you@example.com
//   WEBHOOK_SECRET  – any long random string (must match the DB webhook header)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC   = Deno.env.get("VAPID_PUBLIC")!;
const VAPID_PRIVATE  = Deno.env.get("VAPID_PRIVATE")!;
const VAPID_SUBJECT  = Deno.env.get("VAPID_SUBJECT")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SB_URL         = Deno.env.get("SUPABASE_URL")!;
const SB_KEY         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

serve(async (req) => {
  // Verify webhook secret
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* no body */ }

  // Extract day sale data from the webhook payload
  const record = (body.record ?? body) as Record<string, unknown>;
  const data   = (record.data ?? {}) as Record<string, unknown>;
  const date   = String(record.date ?? data.date ?? "");
  const summary = (data.daySaleSummary ?? {}) as Record<string, number>;

  const inr = (n: number) => "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
  const title = `New day sale${date ? " · " + date : ""}`;
  const body_text = summary.total != null
    ? `Total ${inr(summary.total)} · Cash ${inr(summary.cash ?? 0)} · Digital ${inr(summary.digital ?? 0)}`
    : "Tap to view today's report";

  const payload = JSON.stringify({
    title,
    body: body_text,
    url: "index.html?tab=sales",
  });

  // Fetch all push subscriptions
  const sb = createClient(SB_URL, SB_KEY);
  const { data: subs, error } = await sb
    .from("push_subscriptions")
    .select("endpoint, data");

  if (error) {
    console.error("Failed to fetch subscriptions:", error.message);
    return new Response("DB error", { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return new Response("No subscriptions", { status: 200 });
  }

  // Send push to every subscribed phone; remove expired subscriptions
  const expired: string[] = [];
  await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.data, payload);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expired.push(row.endpoint); // subscription no longer valid
        } else {
          console.error("Push failed for", row.endpoint, err);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expired.length > 0) {
    await sb.from("push_subscriptions").delete().in("endpoint", expired);
    console.log("Removed", expired.length, "expired subscription(s)");
  }

  return new Response(
    JSON.stringify({ sent: subs.length - expired.length, removed: expired.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
