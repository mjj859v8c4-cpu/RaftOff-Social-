/**
 * Netlify prebuild — strip non-public artifacts from the publish tree.
 * Runs from web/ as publish root; script lives in repo scripts/.
 */
const fs = require("fs");
const path = require("path");

const webRoot = path.join(__dirname, "..", "web");
const ban = ["raftoff-social-deploy.zip", ".DS_Store", ".env", ".env.local"];

for (const name of ban) {
  const p = path.join(webRoot, name);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
    console.log("removed", name);
  }
}

console.log("netlify-prebuild ok");
