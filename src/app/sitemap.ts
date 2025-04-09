import type { MetadataRoute } from "next";

export default function Sitemap(): Promise<MetadataRoute.Sitemap> {
  return Promise.resolve([
    {
      url: "https://triviabase.xyz",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: "https://triviabase.xyz/pages/dashboard",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    },
  ]);
}
