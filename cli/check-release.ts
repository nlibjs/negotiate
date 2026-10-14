import * as fs from "node:fs/promises";

const packageJson = JSON.parse(
	await fs.readFile(new URL("../package.json", import.meta.url), "utf-8"),
) as { name: string; version: string };
const jsrJson = JSON.parse(
	await fs.readFile(new URL("../jsr.json", import.meta.url), "utf-8"),
) as { name: string; version: string };

if (
	packageJson.name !== "@nlib/negotiate" ||
	jsrJson.name !== packageJson.name ||
	jsrJson.version !== packageJson.version
) {
	throw new Error("package.json and jsr.json must agree on name and version.");
}

console.log(`Release metadata verified: ${jsrJson.name}@${jsrJson.version}`);
