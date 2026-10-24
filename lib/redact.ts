/**
 * Scrubs analytics payloads before they leave for PostHog. A session id is a bearer secret (anyone holding
 * the link can claim it paid), and `/?pa=…` links carry a payee's UPI ID and name.
 */
export function redact(v: string): string {
  return v.replace(/\/p\/[^/?#\s]+/g, "/p/:id").replace(/\?[^#\s]*\bpa=[^#\s]*/g, "?:upi");
}

export function redactProps<T extends Record<string, unknown> | undefined>(props: T): T {
  if (!props) return props;
  for (const [k, v] of Object.entries(props)) if (typeof v === "string") (props as Record<string, unknown>)[k] = redact(v);
  return props;
}
