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
