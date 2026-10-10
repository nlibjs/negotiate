import * as assert from "node:assert";
import { test } from "node:test";
import { negotiate } from "./negotiate.ts";

test("return null if the statement is empty", () => {
	assert.equal(negotiate(["v1"], ""), null);
	assert.equal(negotiate(["v1"]), null);
	assert.equal(negotiate(["v1"], null), null);
});
test("return v1", () => {
	assert.equal(negotiate(["v1"], "v1"), "v1");
});
test("return null if nothing matches", () => {
	assert.equal(negotiate(["v2"], "v1"), null);
});
test("return the highest", () => {
	assert.equal(negotiate(["v1", "v2"], "v1;q=0.9,v2;q=1"), "v2");
});
test("return the first of same q", () => {
	assert.equal(negotiate(["v1", "v2"], "v1;q=0.9,v2;q=0.9"), "v1");
});
const xMatcher = (list: ReadonlyArray<string>, value: string) => {
	if (value === "x*") {
		for (const v of list) {
			if (v.startsWith("x")) {
				return v;
			}
		}
	} else if (list.includes(value)) {
		return value;
	}
	return null;
};
test("negotiate with matcher", () => {
	assert.equal(
		negotiate(["v1", "v2", "x3"], "v1;q=0.9,v2;q=0.9,x*;q=1", xMatcher),
		"x3",
	);
});
test("negotiate an accept header value", () => {
	assert.equal(
		negotiate(
			["text/html"],
			"text/html,image/avif,image/webp,image/apng,*/*;q=0.8",
		),
		"text/html",
	);
});
test("negotiate an accept header value (highest)", () => {
	assert.equal(
		negotiate(
			["text/html", "image/webp"],
			"text/html,image/avif,image/webp,image/apng,*/*;q=0.8",
		),
		"text/html",
	);
});
test("any", () => {
	assert.equal(
		negotiate(
			["foo"],
			"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		),
		"foo",
	);
});
test("any/any", () => {
	assert.equal(
		negotiate(
			["any/any"],
			"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		),
		"any/any",
	);
});
test("backward", () => {
	assert.equal(
		negotiate(
			["aaa/bbb", "aaa/ccc", "xxx/yyy", "zzz/yyy"],
			"text/html,application/xhtml+xml,application/any;q=0.9,*/yyy,image/webp,image/apng",
		),
		"xxx/yyy",
	);
});
test("forward", () => {
	assert.equal(
		negotiate(
			["aaa/bbb", "aaa/ccc", "xxx/yyy", "zzz/yyy"],
			"text/html,application/xhtml+xml,application/any;q=0.9,xxx/*,image/webp,image/apng",
		),
		"xxx/yyy",
	);
});
test("negotiate a header value with OWS", () => {
	assert.equal(
		negotiate(["application/json"], "text/html, application/json"),
		"application/json",
	);
	assert.equal(negotiate(["text/html"], "text/html ;q=0.9"), "text/html");
	assert.equal(negotiate(["gzip"], "deflate,\tgzip;q=0.5"), "gzip");
});
test("never select a value excluded by q=0", () => {
	assert.equal(negotiate(["text/html"], "text/html;q=0,*/*;q=1"), null);
	assert.equal(negotiate(["text/html"], "*/*;q=1,text/html;q=0"), null);
	assert.equal(negotiate(["text/html"], "text/*;q=0"), null);
	assert.equal(
		negotiate(["text/html", "text/plain"], "text/html;q=0,text/*"),
		"text/plain",
	);
	assert.equal(negotiate(["gzip", "br"], "gzip;q=0,*"), "br");
});
test("use the quality of the most specific range", () => {
	const available = ["text/html", "application/json"];
	assert.equal(
		negotiate(available, "text/*;q=1,text/html;q=0.1,application/json;q=0.9"),
		"application/json",
	);
	assert.equal(
		negotiate(available, "application/json;q=0.9,text/html;q=0.1,text/*;q=1"),
		"application/json",
	);
	assert.equal(
		negotiate(available, "*/*;q=1,application/*;q=0.2,text/html;q=0.5"),
		"text/html",
	);
});
test("RFC 7231 §5.3.2 example", () => {
	const accept = "text/*;q=0.3, text/html;q=0.7, */*;q=0.5";
	assert.equal(negotiate(["text/plain", "image/jpeg"], accept), "image/jpeg");
	assert.equal(negotiate(["text/plain", "text/html"], accept), "text/html");
	assert.equal(negotiate(["text/plain"], accept), "text/plain");
});
test("use the more specific language range", () => {
	const matcher = (list: ReadonlyArray<string>, range: string) =>
		list.find((v) => range === "*" || v === range || v.startsWith(`${range}-`));
	assert.equal(
		negotiate(["en-US", "fr"], "en;q=0.5,en-US;q=0,*", matcher),
		"fr",
	);
});
test("match identifiers case-insensitively", () => {
	assert.equal(negotiate(["text/html"], "TEXT/HTML"), "text/html");
	assert.equal(negotiate(["text/html"], "TEXT/*"), "text/html");
	assert.equal(negotiate(["text/html"], "*/HTML"), "text/html");
	assert.equal(negotiate(["Text/HTML"], "text/html"), "Text/HTML");
	assert.equal(negotiate(["gzip"], "GZIP"), "gzip");
	assert.equal(negotiate(["UTF-8"], "utf-8"), "UTF-8");
	assert.equal(negotiate(["text/html"], "TEXT/HTML;q=0,*/*"), null);
});
