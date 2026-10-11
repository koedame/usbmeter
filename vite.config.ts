import { defineConfig, loadEnv, type Plugin } from "vite";

/** robots.txt and sitemap.xml name the site's address, so they are written from VITE_SITE_URL at build time. */
function siteFiles(siteUrl: string): Plugin {
  return {
    name: "site-files",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const siteUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL;
  if (!siteUrl) throw new Error("VITE_SITE_URL is not set (see .env)");
  return {
    plugins: [siteFiles(siteUrl.replace(/\/$/, ""))],
    build: {
      // Vite would prepend its modulepreload polyfill (MIT code that needs a copyright notice
      // when shipped). There is a single module and no preloading, so it is switched off.
      modulePreload: { polyfill: false },
    },
  };
});
