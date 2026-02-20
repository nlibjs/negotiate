import * as fs from "node:fs/promises";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(await fs.readFile(packageJsonUrl, "utf-8")) as {
	name: string;
	version: string;
	description: string;
};

const jsrJsonUrl = new URL("../jsr.json", import.meta.url);
const jsrJson = JSON.parse(await fs.readFile(jsrJsonUrl, "utf-8")) as {
	name: string;
	version: string;
	description: string;
};

jsrJson.name = packageJson.name;
jsrJson.version = packageJson.version;
jsrJson.description = packageJson.description;

await fs.writeFile(jsrJsonUrl, `${JSON.stringify(jsrJson, null, "\t")}\n`);
