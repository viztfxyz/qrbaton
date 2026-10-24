import { llmsTxt } from "@/lib/apiSpec";
import { publicOrigin } from "@/lib/create";
import { CORS } from "@/lib/http";

export const GET = (req: Request) =>
  new Response(llmsTxt(publicOrigin(req)), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600", ...CORS },
  });
