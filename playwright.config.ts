import { defineConfig } from '@playwright/test';
export default defineConfig({
  // Phaser/GPU acceptance runs share this workstation; serialize real input cases.
  workers: 1, testDir: './tests/e2e', use: { baseURL: 'http://127.0.0.1:4187', browserName: 'chromium', hasTouch: true },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4187 --strictPort', port: 4187, reuseExistingServer: false },
});

