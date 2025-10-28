import fs from "fs";
import path from "path";

const IGNORE = [
  "node_modules",
  ".git",
  ".cache",
  ".next",
  "dist",
  "build",
  ".replit",
  "replit.nix"
];

function walk(dir, depth = 0) {
  let out = "";
  const indent = "│   ".repeat(depth);
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (IGNORE.includes(file.name)) continue;

    const pointer = (i === files.length - 1) ? "└── " : "├── ";
    const fullPath = path.join(dir, file.name);

    out += `${indent}${pointer}${file.name}\n`;

    if (file.isDirectory()) {
      out += walk(fullPath, depth + 1);
    }
  }
  return out;
}

const result = walk(".");
fs.writeFileSync("structure.txt", result);
console.log("Filtered structure written to structure.txt!");