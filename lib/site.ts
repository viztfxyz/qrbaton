/** Name and copy shared by metadata, the landing page, OG images and docs. Rename the project here. */
export const SITE = {
  name: "qrbaton",
  repo: "https://github.com/viztfxyz/qrbaton",
  author: { name: "viztf", url: "https://viztf.lol" },
  title: "Any UPI QR, one tap away.",
  description:
    "Turn the UPI QR your AI agent hits at checkout into a one-tap pay page on your phone. Opens GPay, PhonePe or Paytm pre-filled. MCP server + HTTP API, no keys.",
  keywords: [
    "UPI payment link",
    "UPI QR to link",
    "AI agent payments",
    "agentic commerce India",
    "MCP server UPI",
    "Claude MCP payments",
    "pay UPI QR from screenshot",
    "UPI deep link",
    "GPay PhonePe Paytm link",
    "Blinkit Zepto Swiggy agent checkout",
  ],
};

/** Canonical origin: PUBLIC_URL, else Vercel's production URL, else local dev. */
export function siteUrl(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const FAQ = [
  {
    q: "Does it touch my money?",
    a: "No. It only builds a link. The payment happens inside your own UPI app (GPay, PhonePe, Paytm or any other), which shows the real payee name before you enter your PIN.",
  },
  {
    q: "Which agents does it work with?",
    a: "Anything that can make an HTTP request or use MCP: Claude Code, Claude Desktop, Cursor, Codex, ChatGPT agents, browser agents and your own scripts. There’s also an installable SKILL.md and an llms.txt.",
  },
  {
    q: "Do I need an API key or an account?",
    a: "No. Creating a link is open and rate-limited per IP. Each link comes with its own manage token, so only whoever created it can change its status.",
  },
  {
    q: "What if I open the link on a laptop?",
    a: "The page shows a fresh UPI QR with the same payee and amount, so you can scan it with any UPI app on your phone.",
  },
  {
    q: "How does my agent know I paid?",
    a: "Tap “I’ve paid” on the page (optionally with your UTR). The agent sees it through the status API, MCP or a signed webhook, then finishes the order.",
  },
  {
    q: "Is my order visible to anyone?",
    a: "Pay pages are unlisted, not indexed and not cached, and they expire (30 minutes by default, up to 24 hours; the order stays viewable, without the pay button, for a day after). Anyone with the link can see the order, so share it only with the person paying.",
  },
];
