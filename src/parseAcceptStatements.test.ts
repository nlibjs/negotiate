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

test("allow OWS around list elements", () => {
	for (const loose of [false, true]) {
		assert.deepEqual(
			[...parseAcceptStatements("text/html, application/json", loose)],
			[
				{ value: "text/html", q: 1 },
				{ value: "application/json", q: 1 },
			],
		);
		assert.deepEqual(
			[
				...parseAcceptStatements(
					" \ttext/html\t,\t application/json \t",
					loose,
				),
			],
			[
				{ value: "text/html", q: 1 },
				{ value: "application/json", q: 1 },
			],
		);
	}
});

test("allow OWS before semicolons", () => {
	for (const loose of [false, true]) {
		assert.deepEqual(
			[...parseAcceptStatements("text/html ;q=0.9,image/png\t; q=0.8", loose)],
			[
				{ value: "text/html", q: 0.9 },
				{ value: "image/png", q: 0.8 },
			],
		);
	}
});

test("ignore empty list elements", () => {
	assert.deepEqual(
		[...parseAcceptStatements(", text/html, ,\t,image/png,")],
		[
			{ value: "text/html", q: 1 },
			{ value: "image/png", q: 1 },
		],
	);
});

test("reject whitespace inside a value", () => {
	assert.throws(
		() => [...parseAcceptStatements("text /html")],
		/^Error: InvalidValue/,
	);
	assert.deepEqual([...parseAcceptStatements("text /html", true)], []);
});
