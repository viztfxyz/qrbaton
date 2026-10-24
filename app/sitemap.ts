import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  return [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/demo`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${url}/llms.txt`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${url}/SKILL.md`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
