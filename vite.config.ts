import { defineConfig, loadEnv, type Plugin } from "vite";

/** robots.txt, sitemap.xml and llms.txt name the site's address, so they are written from VITE_SITE_URL at build time. */
function siteFiles(siteUrl: string): Plugin {
  return {
    name: "site-files",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source: `# USB Meter Web

> A web page that shows live voltage, current, power and capacity from a Bluetooth USB tester (ATorch UD18, AT24, J7-C and similar meters) in the browser, with graphs, CSV export and an export made for AI analysis. It runs entirely in the browser, sends no data anywhere and needs no account.

## Pages

- [USB Meter Web](${siteUrl}/): the tool itself (needs Chrome or Edge for Web Bluetooth)
- [USB Meter Web as Markdown](${siteUrl}/index.md): how to use it, supported meters, browser support, privacy and questions

## Source

- [koedame/usbmeter on GitHub](https://github.com/koedame/usbmeter): MIT licensed source and issues
`,
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
