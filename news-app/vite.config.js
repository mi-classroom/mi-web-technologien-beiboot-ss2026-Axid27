import { defineConfig } from 'vite';

// news-app imports the Gesture Library directly from ../body-tracking/src/lib
// (no published package — see docs/adr/ADR-06-api-reflection-issue4.md).
// fs.allow must include the repo root so Vite can serve those files.
export default defineConfig({
  base: '/mi-web-technologien-beiboot-ss2026-Axid27/',
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
