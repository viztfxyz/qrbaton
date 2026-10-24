import "server-only";
import { z } from "zod";
import { CREATE_LIMIT } from "./auth";
import { SITE } from "./site";
import { ClaimSchema, CreateSessionSchema, UpdateSessionSchema } from "./order";

const schema = (s: z.ZodType) => {
  const { $schema: _, ...rest } = z.toJSONSchema(s, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
  return rest;
};

export const createInputSchema = () => schema(CreateSessionSchema);
export const updateInputSchema = () => schema(UpdateSessionSchema);

const CREATED = {
  type: "object",
  properties: {
    id: { type: "string" },
    url: { type: "string", description: "The pay page. Send this to the person who pays." },
    statusUrl: { type: "string" },
    manageToken: { type: "string", description: "Bearer token for PATCH on this session. Shown once; keep it private." },
    expiresAt: { type: "integer", description: "Unix ms" },
    payee: { type: "object", properties: { pa: { type: "string" }, pn: { type: "string" }, am: { type: "string" } } },
  },
};

const STATUS = {
  type: "object",
  properties: {
    id: { type: "string" },
    status: { enum: ["pending", "paid", "failed", "expired"] },
    paidBy: { enum: ["creator", "payer"], description: "payer = the payer tapped \"I've paid\" (unverified)" },
    utr: { type: "string" },
    updatedAt: { type: "integer" },
    expiresAt: { type: "integer" },
  },
};

const err = { description: "Error", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } } };

export function openApi(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: SITE.name,
      version: "1.0.0",
      description: "Turn a UPI QR or UPI details (plus an optional cart) into a review-and-pay page link that opens GPay, PhonePe, Paytm or any UPI app. No API key needed.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/sessions": {
        post: {
          operationId: "createPayLink",
          summary: "Create a pay link",
          description: `Send exactly one of upi or qr, or payee.pa on its own; payee fields override what the QR says (e.g. add an amount to a static QR). Amount: payee.am, else order.total, else the sum of order.items (only when there are no charges; charges are the full bill as displayed, so send total with them). When both am and total are given they must match. Limit: ${CREATE_LIMIT} per hour per IP. Also accepts multipart/form-data with a qr file plus upi/payee/order/ttlSec fields (objects as JSON strings).`,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: createInputSchema() },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    qr: { type: "string", format: "binary" },
                    upi: { type: "string" },
                    payee: { type: "string", description: "JSON" },
                    order: { type: "string", description: "JSON" },
                    ttlSec: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: CREATED } } },
            "400": err,
            "429": err,
          },
        },
      },
      "/api/sessions/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          operationId: "getPaymentStatus",
          summary: "Payment status (public)",
          responses: { "200": { description: "OK", content: { "application/json": { schema: STATUS } } }, "404": err },
        },
        patch: {
          operationId: "setPaymentStatus",
          summary: "Report the outcome; the pay page updates live",
          security: [{ manageToken: [] }],
          requestBody: { required: true, content: { "application/json": { schema: updateInputSchema() } } },
          responses: { "200": { description: "OK", content: { "application/json": { schema: STATUS } } }, "401": err, "404": err },
        },
      },
      "/api/sessions/{id}/claim": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          operationId: "claimPaid",
          summary: "Payer says \"I've paid\" (used by the pay page; sets paidBy: payer)",
          requestBody: { content: { "application/json": { schema: schema(ClaimSchema) } } },
          responses: { "200": { description: "OK", content: { "application/json": { schema: STATUS } } }, "409": err, "404": err },
        },
      },
    },
    components: { securitySchemes: { manageToken: { type: "http", scheme: "bearer", description: "manageToken from createPayLink" } } },
  };
}

/** Installable agent skill (Claude Code / Agent Skills format): frontmatter + the llms.txt guide. */
export function skillMd(origin: string) {
  return `---
name: ${SITE.name}
description: Use when shopping or checking out for the user and the site shows a UPI QR code or asks for UPI payment (India). Turns the QR plus cart into a one-tap pay link to send the user instead of a screenshot.
---

${llmsTxt(origin)}
## Workflow

1. At checkout, capture the UPI QR (screenshot the QR element, or read the upi:// string from the page).
2. Create the link with the QR and the cart: merchant, items, charges, total, delivery, site, and your name as "agent".
3. Send the user only the "url" with one line of context (e.g. "Blinkit order ready, ₹642: <url>"). Never send the QR image.
4. Poll get status every ~10 s (or use callbackUrl). "paidBy":"payer" means the user tapped "I've paid"; confirm on the site.
5. Once paid, finish the order, then PATCH status "paid" (or "failed") so the page shows the final state.
`;
}

export function llmsTxt(origin: string) {
  return `# ${SITE.name}

> Make a polished UPI pay page from a QR code or UPI details, optionally with the cart (items, charges, delivery, shop site). Send the link to whoever pays: they review the order and tap Pay to open GPay, PhonePe, Paytm or any UPI app. No API key needed.

- MCP (streamable HTTP): ${origin}/mcp (tools: create_pay_link, get_payment_status, set_payment_status)
- OpenAPI: ${origin}/openapi.json
- Agent skill: ${origin}/SKILL.md
- Live demo page: ${origin}/demo

## Create a link

POST ${origin}/api/sessions (JSON). Give the payee one of three ways:

- "qr": the QR image as base64 or a data: URI
- "upi": the raw "upi://pay?pa=…&pn=…&am=…" string
- "payee": {"pa":"shop@ybl","pn":"Shop","am":349}; these fields also override what the QR/upi says

Optional "order": {"merchant","site","agent","note","total","items":[{"name","qty","price","mrp","unit","image"}],"charges":[{"label","amount"}],"delivery":{"slot","address":{"label","text"}},"orderId","logo"}.
"charges" is the bill exactly as shown, top to bottom (e.g. Item total, Delivery, Handling fee); negative amounts are discounts.
Amount comes from payee.am, else order.total, else the sum of items (only when there are no charges). If you send charges, send total too. If both am and total are given they must match.
"ttlSec": 60 to 86400 (default 1800). "callbackUrl": optional https webhook.

\`\`\`bash
curl -X POST ${origin}/api/sessions -H 'content-type: application/json' -d '{
  "qr": "'"$(base64 -w0 qr.png)"'",
  "order": {"merchant":"Blinkit","site":"https://blinkit.com","agent":"Claude","note":"Groceries for the week",
    "items":[{"name":"Amul Taaza Milk","unit":"1 L","qty":2,"price":56}],
    "charges":[{"label":"Item total","amount":112},{"label":"Delivery","amount":0}],"total":112}
}'
# or upload the file directly:
curl -X POST ${origin}/api/sessions -F qr=@qr.png -F 'payee={"am":112}'
\`\`\`

Returns {"id","url","statusUrl","manageToken","expiresAt","payee"}. Send "url" to the payer. Keep "manageToken" private.

## Status

- GET ${origin}/api/sessions/{id} → {"status":"pending|paid|failed|expired","paidBy"?,"utr"?}
- "paidBy":"payer" means the payer tapped "I've paid" on the page (unverified, may include their UTR). Confirm it, or overrule with failed.
- PATCH ${origin}/api/sessions/{id} with "Authorization: Bearer {manageToken}" and {"status":"paid"|"failed"|"expired","utr"?}. The open page updates live. Otherwise terminal statuses are final.
- Webhooks: add "callbackUrl":"https://…" when creating. Each status change POSTs {"event":"session.status","id","status","paidBy","utr",…} with header x-qrbaton-signature: sha256=HMAC-SHA256(key = hex sha256 of your manageToken, raw body).

## Notes

- Limit: ${CREATE_LIMIT} links per hour per IP.
- ${SITE.name} never handles money. The payment happens in the payer's UPI app, which shows the real payee name.
- Pages are noindex and not cached, but anyone with the link can see the order (including any delivery address).
`;
}
