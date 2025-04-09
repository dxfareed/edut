import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://triviabase.xyz";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pages/dashboard"],
      disallow: ["/pages/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
