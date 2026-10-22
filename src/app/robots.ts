import type { MetadataRoute } from "next";

// Belt-and-braces with the metadata robots tag: this app is private.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
