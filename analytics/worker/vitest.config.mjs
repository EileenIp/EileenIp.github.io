import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// Tests run inside workerd against a real local D1, not a mock. That matters
// here: most of what this Worker does is D1 queries and header handling, and a
// hand-rolled fake would have agreed with whatever the code did.
//
// Note for anyone updating this: @cloudflare/vitest-pool-workers 0.22 dropped
// the `./config` entry point and its `defineWorkersConfig` helper. The pool is
// now a Vitest plugin, which is what this file uses.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        // The workerd binary bundled with this pool supports compatibility
        // dates only up to 2026-08-22, while wrangler.toml -- and therefore
        // production -- is on 2026-09-13. Pinning the older date here keeps
        // the test runtime startable without downgrading the deployed Worker
        // to suit its test harness. Nothing this Worker uses (fetch,
        // crypto.subtle, D1) differs between the two dates. If a test ever
        // needs newer runtime behaviour, update the pool rather than this.
        compatibilityDate: "2026-08-22",

        // The real secrets are set with `wrangler secret put` and never appear
        // in the repo; these stand in for them.
        bindings: {
          SALT_SECRET: "test-salt-not-the-real-one",
          STATS_TOKEN: "test-token-not-the-real-one",
        },
      },
    }),
  ],
});
