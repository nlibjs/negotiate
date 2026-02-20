import * as fs from "node:fs/promises";
import { URL } from "node:url";
import ts from "typescript";
import { listFiles, listTsSourceStringLiterals } from "./util.ts";

interface OutputPattern {
	destDir: URL;
	/** @example .mjs, .cjs */
	ext: string;
	compilerOptions: ts.CompilerOptions;
}

const outputPattens = new Set<OutputPattern>();
outputPattens.add({
	destDir: new URL("../mjs/", import.meta.url),
	ext: ".mjs",
	compilerOptions: {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
	},
});
outputPattens.add({
	destDir: new URL("../cjs/", import.meta.url),
	ext: ".cjs",
	compilerOptions: {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.CommonJS,
	},
});

const srcDir = new URL("../src/", import.meta.url);
const exclude = [/\.test\..*$/];
const baseTsConfig = JSON.parse(
	await fs.readFile(new URL("../tsconfig.json", import.meta.url), "utf8"),
) as { compilerOptions: ts.CompilerOptions };

for await (const fileUrl of listFiles(srcDir, exclude)) {
	const relativePath = fileUrl.pathname.slice(srcDir.pathname.length);
	const filePath = fileUrl.pathname.slice(srcDir.pathname.length);
	if (filePath.endsWith(".ts")) {
		const tsCode = await fs.readFile(fileUrl, "utf-8");
		const tsSource = ts.createSourceFile(
			filePath,
			tsCode,
			ts.ScriptTarget.ESNext,
		);
		const replaceList: Array<ts.StringLiteral> = [];
		const ext = ".ts";
		for (const node of listTsSourceStringLiterals(tsSource)) {
			const importFromText = node.text;
			if (importFromText.startsWith(".") && importFromText.endsWith(ext)) {
				replaceList.push(node);
			}
		}
		replaceList.sort((n1, n2) => n2.getFullStart() - n1.getFullStart());
		for (const pattern of outputPattens) {
			let code = tsCode;
			for (const node of replaceList) {
				const start = code.indexOf(node.text, node.getFullStart());
				const end = start + node.text.length;
				code = `${code.slice(0, end - ext.length)}${pattern.ext}${code.slice(end)}`;
			}
			const output = ts.transpileModule(code, {
				compilerOptions: {
					...baseTsConfig.compilerOptions,
					...pattern.compilerOptions,
				},
			});
			const destUrl = new URL(
				filePath.replace(/\.ts$/, pattern.ext),
				pattern.destDir,
			);
			await fs.mkdir(new URL(".", destUrl), { recursive: true });
			await fs.writeFile(destUrl, output.outputText);
		}
		console.info(`done:${relativePath}`);
	}
}
