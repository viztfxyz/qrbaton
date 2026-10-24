import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Index the landing, demo and agent docs; keep pay pages (they carry orders/addresses) and the API out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/demo", "/llms.txt", "/SKILL.md", "/openapi.json"], disallow: ["/p/", "/api/", "/mcp", "/og", "/*?pa="] },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
