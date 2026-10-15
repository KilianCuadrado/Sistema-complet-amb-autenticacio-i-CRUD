import fs from "node:fs";
import path from "node:path";

export function readJson(file, key) {
  const data = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  return data[key];
}

export function writeJson(file, key, values) {
  fs.writeFileSync(
    path.resolve(file),
    `${JSON.stringify({ [key]: values }, null, 2)}\n`,
  );
}
