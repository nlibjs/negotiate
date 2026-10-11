import * as assert from "node:assert";
import { test } from "node:test";
import { languageMatcher } from "./languageMatcher.ts";
import { negotiate } from "./negotiate.ts";

test("match a prefix at a subtag boundary", () => {
	assert.equal(negotiate(["en-US"], "en", languageMatcher), "en-US");
	assert.equal(
		negotiate(["zh-Hant-TW"], "zh-Hant", languageMatcher),
		"zh-Hant-TW",
	);
	assert.equal(negotiate(["eng"], "en", languageMatcher), null);
	assert.equal(negotiate(["en"], "en-US", languageMatcher), null);
});
test("match case-insensitively", () => {
	assert.equal(negotiate(["en-US"], "en-us", languageMatcher), "en-US");
	assert.equal(negotiate(["en-us"], "EN", languageMatcher), "en-us");
});
test("match any tag with *", () => {
	assert.equal(negotiate(["fr", "de"], "ja,*;q=0.1", languageMatcher), "fr");
	assert.equal(negotiate([], "*", languageMatcher), null);
});
test("select by quality and specificity", () => {
	assert.equal(
		negotiate(["ja", "en-US"], "ja;q=0.5, en;q=0.8", languageMatcher),
		"en-US",
	);
	assert.equal(
		negotiate(["en-US", "en-GB"], "en;q=0.5, en-GB;q=0.9", languageMatcher),
		"en-GB",
	);
	assert.equal(
		negotiate(["en-US", "fr"], "en-US;q=0, *", languageMatcher),
		"fr",
	);
});
