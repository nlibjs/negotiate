import * as assert from "node:assert";
import { test } from "node:test";
import { parseAcceptStatements } from "./parseAcceptStatements.ts";

test("parse the accept header", () => {
	const headerValue = "text/html,application/xml;q=0.9,image/avif,*/*;q=0.8";
	const generator = parseAcceptStatements(headerValue);
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "text/html", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "application/xml", q: 0.9 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "image/avif", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "*/*", q: 0.8 },
	});
	assert.deepEqual(generator.next(), { done: true, value: undefined });
});

test("throw at an invalid q parameter", () => {
	const headerValue =
		"text/html,application/xml;q=0.9,image/avif,*/*;q=0.8,image/png;q=1.1";
	const generator = parseAcceptStatements(headerValue);
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "text/html", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "application/xml", q: 0.9 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "image/avif", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "*/*", q: 0.8 },
	});
	assert.throws(() => generator.next(), /^Error: InvalidQuality/);
});

test("ignore invalid q parameters if loose=true", () => {
	const headerValue =
		"text/html,application/xml;q=0.9,image/avif,*/*;q=0.8,image/png;q=1.1";
	const generator = parseAcceptStatements(headerValue, true);
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "text/html", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "application/xml", q: 0.9 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "image/avif", q: 1 },
	});
	assert.deepEqual(generator.next(), {
		done: false,
		value: { value: "*/*", q: 0.8 },
	});
	assert.deepEqual(generator.next(), { done: true, value: undefined });
});
