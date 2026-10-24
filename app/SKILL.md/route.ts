import { skillMd } from "@/lib/apiSpec";
import { publicOrigin } from "@/lib/create";
import { CORS } from "@/lib/http";

export const GET = (req: Request) =>
  new Response(skillMd(publicOrigin(req)), {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600", ...CORS },
  });
