import * as fs from "node:fs/promises";
import { URL } from "node:url";
import { listFiles } from "./util.ts";

const srcDir = new URL("../src/", import.meta.url);
const destUrl = new URL("mod.ts", srcDir);
const excludeList = [/\.test\..*$/, /\.private\..*$/];

const lines: Array<string> = [];
for await (const { pathname } of listFiles(srcDir, excludeList)) {
	if (pathname.endsWith(".ts") && destUrl.pathname !== pathname) {
		const from = pathname.slice(srcDir.pathname.length);
		lines.push(`export * from "./${from}";`);
	}
}
lines.sort((l1, l2) => (l1.toLowerCase() < l2.toLowerCase() ? -1 : 1));
lines.push("");
await fs.writeFile(destUrl, lines.join("\n"));
