import posthog from "posthog-js";
import { redactProps } from "@/lib/redact";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-08-30",
    capture_exceptions: true,
    // No logins, so no person profiles: events stay anonymous.
    person_profiles: "never",
    // Pay pages show orders and delivery addresses.
    disable_session_recording: true,
    // Same-origin API calls carry the browser's distinct id, so server events join the same person.
    tracing_headers: [location.hostname],
    before_send: (e) => {
      if (!e) return e;
      redactProps(e.properties);
      redactProps(e.$set);
      redactProps(e.$set_once);
      return e;
    },
  });
} else if (process.env.NODE_ENV === "development") {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}
