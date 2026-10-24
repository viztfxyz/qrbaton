import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import type { CreateSessionInput } from "./order";
import { redactProps } from "./redact";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (!token && process.env.NODE_ENV === "development") {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

let client: PostHog | null = null;
const ph = () => (token ? (client ??= new PostHog(token, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST, flushAt: 1, flushInterval: 0 })) : null);

/**
 * The browser's PostHog id when the call came from our page (tracing headers), else a fresh random id, so
 * server events can't be tied to a caller, an IP or a pay link.
 */
export const distinctFor = (req: Request) => req.headers.get("x-posthog-distinct-id") || randomUUID();

type Props = Record<string, unknown>;

/** Sends an event now; for code already running after the response (e.g. webhooks). No-op without a token. */
export async function send(event: string, distinctId: string, properties: Props = {}) {
  await ph()
    ?.captureImmediate({ distinctId, event, properties: redactProps({ $process_person_profile: false, ...properties }) })
    .catch(() => {});
}

/** Sends an event after the response is sent. */
export function track(event: string, distinctId: string, properties: Props = {}) {
  if (token) after(() => send(event, distinctId, properties));
}

export async function sendException(error: unknown, distinctId?: string, properties: Props = {}) {
  await ph()
    ?.captureExceptionImmediate(error, distinctId, redactProps(properties))
    .catch(() => {});
}

/**
 * Which features a new link used. Deliberately nothing about the payment: no amount, payee, cart
 * contents or size, and no link id.
 */
export const createdProps = (input: CreateSessionInput) => ({
  input: input.qr ? "qr" : input.upi ? "upi" : "payee",
  has_order: !!input.order,
  has_callback: !!input.callbackUrl,
});
