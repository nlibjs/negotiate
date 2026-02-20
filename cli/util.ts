import * as fs from "node:fs/promises";
import { URL } from "node:url";
import ts from "typescript";

export const listFiles = async function* (
	fileUrl: URL,
	excludeList: Array<RegExp> = [],
): AsyncGenerator<URL> {
	const stats = await fs.stat(fileUrl);
	if (stats.isFile()) {
		for (const regexp of excludeList) {
			if (regexp.test(fileUrl.pathname)) {
				return;
			}
		}
		yield fileUrl;
	} else if (stats.isDirectory()) {
		fileUrl.pathname = fileUrl.pathname.replace(/\/*$/, "/");
		for (const name of await fs.readdir(fileUrl)) {
			yield* listFiles(new URL(name, fileUrl), excludeList);
		}
	}
};

export const walkTsSource = function* (
	node: ts.Node,
	tsSource: ts.SourceFile,
	depth = 0,
): Generator<[ts.Node, number]> {
	yield [node, depth];
	for (const child of node.getChildren(tsSource)) {
		yield* walkTsSource(child, tsSource, depth + 1);
	}
};

export const listTsSourceStringLiterals = function* (
	tsSource: ts.SourceFile,
): Generator<ts.StringLiteral> {
	for (const [node] of walkTsSource(tsSource, tsSource)) {
		if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
			let checking = false;
			for (const [n] of walkTsSource(node, tsSource)) {
				if (checking) {
					if (ts.isStringLiteral(n)) {
						yield n;
						break;
					}
				} else if (n.kind === ts.SyntaxKind.FromKeyword) {
					checking = true;
				}
			}
		} else if (ts.isImportTypeNode(node)) {
			let checking = false;
			for (const [n] of walkTsSource(node, tsSource)) {
				if (checking) {
					if (ts.isStringLiteral(n)) {
						yield n;
						break;
					}
				} else if (n.kind === ts.SyntaxKind.OpenParenToken) {
					checking = true;
				}
			}
		}
	}
};
