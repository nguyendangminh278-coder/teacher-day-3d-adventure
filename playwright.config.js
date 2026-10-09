import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 240000,
  expect: { timeout: 35000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8123",
    viewport: { width: 1100, height: 700 },
    channel: process.platform === "win32" ? "chrome" : undefined,
    launchOptions: {
      args: [
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist",
      ],
    },
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "node tools/serve.mjs --site",
    url: "http://127.0.0.1:8123",
    reuseExistingServer: !process.env.CI,
  },
});
