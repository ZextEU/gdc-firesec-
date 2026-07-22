// Regenerates styles.min.css + script.min.js from the readable sources.
// Run after editing styles.css or script.js:  node build-assets.mjs
// Requires: npm i -g clean-css-cli terser   (or npx)
import { execSync } from "node:child_process";
execSync("npx --yes clean-css-cli -O2 -o styles.min.css styles.css", { stdio: "inherit" });
execSync("npx --yes terser script.js --compress --mangle -o script.min.js", { stdio: "inherit" });
console.log("✓ styles.min.css and script.min.js rebuilt");
