import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/api/", "/admin", "/admin/"],
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
