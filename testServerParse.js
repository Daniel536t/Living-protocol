const { execSync } = require("fs");
const fs = require("fs");

// Simulate what server.js does
const input = "Build me a loyalty program";
fs.writeFileSync("/tmp/lpb-input.txt", input);

const { execSync: exec } = require("child_process");
const raw = exec('node main.js "$(cat /tmp/lpb-input.txt)" 2>&1', {
  cwd: "/home/ubuntu/living-protocol-builder", timeout: 90000, encoding: "utf8", shell: "/bin/bash"
});

// Check regex
const tm = raw.match(/Tx: (0x[a-fA-F0-9]+)/);
console.log("Tx match:", tm ? tm[1] : "NO MATCH");

// Show last 200 chars of raw output
console.log("\n--- Last 200 chars ---");
console.log(raw.slice(-200));
