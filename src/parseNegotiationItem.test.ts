import * as assert from "node:assert";
import { test } from "node:test";
import { parseNegotiationItem } from "./parseNegotiationItem.ts";

test("accept text/html", () => {
	assert.deepStrictEqual(parseNegotiationItem("text/html"), {
		value: "text/html",
		parameters: {},
	});
});
test("accept text/*", () => {
	assert.deepStrictEqual(parseNegotiationItem("text/*"), {
		value: "text/*",
		parameters: {},
	});
});
test("accept */*", () => {
	assert.deepStrictEqual(parseNegotiationItem("*/*"), {
		value: "*/*",
		parameters: {},
	});
});
test("accept /html", () => {
	assert.deepStrictEqual(parseNegotiationItem("/html"), {
		value: "/html",
		parameters: {},
	});
});
test("reject sparse string", () => {
	assert.throws(
		() => parseNegotiationItem(" text/html"),
		/^Error: InvalidValue/,
	);
});
test("reject empty parameter", () => {
	assert.throws(
		() => parseNegotiationItem("text/html;"),
		/^Error: InvalidNegotiationParameter/,
	);
});
test("accept a parameter", () => {
	assert.deepStrictEqual(parseNegotiationItem("text/html; q=0.9 "), {
		value: "text/html",
		parameters: { q: "0.9" },
	});
});
test("reject second empty parameter", () => {
	assert.throws(
		() => parseNegotiationItem("text/html;q=0.9;"),
		/^Error: InvalidNegotiationParameter/,
	);
});
test("accept multiple parameters", () => {
	assert.deepStrictEqual(parseNegotiationItem("text/html;q=0.9;p=0.8"), {
		value: "text/html",
		parameters: { q: "0.9", p: "0.8" },
	});
});
test("reject spaces before equal signs", () => {
	assert.throws(
		() => parseNegotiationItem("text/html;q=0.9;p =0.8"),
		/^Error: InvalidAttribute/,
	);
});
test("reject spaces after equal signs", () => {
	assert.throws(
		() => parseNegotiationItem("text/html;q=0.9;p= 0.8"),
		/^Error: InvalidAttributeValue/,
	);
});
test("accept the boundary paramter", () => {
	assert.deepStrictEqual(
		parseNegotiationItem(
			"multipart/form-data; boundary=----WebKitFormBoundaryBD30bQglmASNpNSt",
		),
		{
			value: "multipart/form-data",
			parameters: { boundary: "----WebKitFormBoundaryBD30bQglmASNpNSt" },
		},
	);
});
test("accept OWS before a semicolon", () => {
	assert.deepStrictEqual(parseNegotiationItem("text/html \t;q=0.9"), {
		value: "text/html",
		parameters: { q: "0.9" },
	});
});
test("accept quoted-string values with whitespace and delimiters", () => {
	assert.deepStrictEqual(
		parseNegotiationItem('text/html;a="hello world";b="a;b";c="x,y=z"'),
		{
			value: "text/html",
			parameters: { a: "hello world", b: "a;b", c: "x,y=z" },
		},
	);
	assert.deepStrictEqual(parseNegotiationItem('text/html;a="\tx\t" ;b=1'), {
		value: "text/html",
		parameters: { a: "\tx\t", b: "1" },
	});
});
test("accept an empty quoted-string", () => {
	assert.deepStrictEqual(parseNegotiationItem('text/html;a=""'), {
		value: "text/html",
		parameters: { a: "" },
	});
});
test("decode quoted-pairs", () => {
	assert.deepStrictEqual(parseNegotiationItem('text/html;a="x\\"y\\\\z\\w"'), {
		value: "text/html",
		parameters: { a: 'x"y\\zw' },
	});
});
test("reject unterminated quoted-strings", () => {
	for (const input of [
		'text/html;a="x',
		'text/html;a="x\\"',
		'text/html;a="x\\',
		'text/html;a="x;b=1',
	]) {
		assert.throws(() => parseNegotiationItem(input), /^Error: InvalidQuote/);
	}
});
test("reject characters after a quoted-string", () => {
	assert.throws(
		() => parseNegotiationItem('text/html;a="x"y'),
		/^Error: InvalidQuote/,
	);
});
test("reject control characters in a quoted-string", () => {
	assert.throws(
		() => parseNegotiationItem('text/html;a="x\ny"'),
		/^Error: InvalidAttributeValue/,
	);
});
test("reject an empty token value", () => {
	assert.throws(
		() => parseNegotiationItem("text/html;a="),
		/^Error: InvalidAttributeValue/,
	);
});
