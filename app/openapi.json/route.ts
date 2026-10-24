import { openApi } from "@/lib/apiSpec";
import { publicOrigin } from "@/lib/create";
import { json } from "@/lib/http";

export const GET = (req: Request) => json(openApi(publicOrigin(req)), 200, { "cache-control": "public, max-age=3600" });
