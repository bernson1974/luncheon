import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import("eslint").Linter.Config[]} */
const nextConfig = require("eslint-config-next/core-web-vitals");

/** next/core-web-vitals inkl. react-hooks 7 – denna regel flaggar vanliga Next/localStorage-mönster */
const config = [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default config;
