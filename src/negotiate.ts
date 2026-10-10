import { parseAcceptStatements } from "./parseAcceptStatements.ts";

/**
 * Returns the item of `arr` matched by the range `value`, or null.
 * `negotiate` calls it with one available value at a time.
 */
export type NegotiateMatcher<Type extends string> = (
	arr: ReadonlyArray<Type>,
	value: string,
) => Type | null | undefined;

const defaultMatcher = <Type extends string>(
	candidateList: ReadonlyArray<Type>,
	negotiateValue: string,
): Type | null => {
	if (negotiateValue === "*") {
		return candidateList[0];
	}
	const backward = negotiateValue.startsWith("*") ? 2 : 0;
	const forward = negotiateValue.endsWith("*") ? 1 : 0;
	const pattern = negotiateValue.slice(
		backward ? 1 : 0,
		forward ? -1 : negotiateValue.length,
	);
	switch (backward + forward) {
		case 3:
			// @example */*
			return candidateList.find((item) => item.includes(pattern)) || null;
		case 2:
			// @example */bbb
			return candidateList.find((item) => item.endsWith(pattern)) || null;
		case 1:
			// @example aaa/*
			return candidateList.find((item) => item.startsWith(pattern)) || null;
		default:
			// @example aaa/bbb
			return candidateList.find((item) => item === pattern) || null;
	}
};

/**
 * Counts wildcards and literal characters of a range so that more specific
 * ranges (`text/html` > `text/*` > `*\/*`, `en-US` > `en` > `*`) win.
 */
const getSpecificity = (range: string): [number, number] => {
	let wildcards = 0;
	for (const char of range) {
		if (char === "*") {
			wildcards += 1;
		}
	}
	return [wildcards, range.length - wildcards];
};

const isMoreSpecific = (
	[wildcards1, literals1]: [number, number],
	[wildcards2, literals2]: [number, number],
) =>
	wildcards1 < wildcards2 ||
	(wildcards1 === wildcards2 && literals2 < literals1);

/**
 * https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3
 * Parses an "Accept-*" value and return the result of negotiation.
 *
 * Each available value gets the quality of the most specific range that
 * matches it, and the value with the highest nonzero quality is returned.
 * A value whose most specific range has `q=0` is never returned.
 * Ties are broken by the order of the ranges in the header, then by the order
 * of `availableValues`.
 */
export const negotiate = <Value extends string>(
	availableValues: ReadonlyArray<Value>,
	acceptStatements?: string | null,
	valueMatcher: NegotiateMatcher<Value> = defaultMatcher,
): Value | null => {
	if (!acceptStatements) {
		return null;
	}
	const ranges = [...parseAcceptStatements(acceptStatements, true)].map(
		(range, index) => ({
			...range,
			index,
			specificity: getSpecificity(range.value),
		}),
	);
	let result: Value | null = null;
	let maxQ = 0;
	let minIndex = Number.POSITIVE_INFINITY;
	for (const available of availableValues) {
		let best: (typeof ranges)[number] | null = null;
		for (const range of ranges) {
			if (valueMatcher([available], range.value)) {
				if (
					!best ||
					isMoreSpecific(range.specificity, best.specificity) ||
					(!isMoreSpecific(best.specificity, range.specificity) &&
						best.q < range.q)
				) {
					best = range;
				}
			}
		}
		if (
			best &&
			0 < best.q &&
			(maxQ < best.q || (maxQ === best.q && best.index < minIndex))
		) {
			result = available;
			maxQ = best.q;
			minIndex = best.index;
		}
	}
	return result;
};
