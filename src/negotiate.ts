import { parseAcceptStatements } from "./parseAcceptStatements.ts";
import { parseNegotiationItem } from "./parseNegotiationItem.ts";

/**
 * Returns the item of `arr` matched by the range `value`, or null.
 * `parameters` are the media type parameters of the range (`q` and accept
 * extensions excluded).
 * `negotiate` calls it with one available value at a time.
 */
export type NegotiateMatcher<Type extends string> = (
	arr: ReadonlyArray<Type>,
	value: string,
	parameters: Readonly<Record<string, string>>,
) => Type | null | undefined;

/**
 * Splits an available value such as `text/html;level=1` into the lowercased
 * identifier and its parameters. Identifiers are case-insensitive
 * (RFC 7231 §3.1.1.1, §3.1.2.1, §5.3.3, §5.3.5).
 */
const parseAvailable = (item: string) => {
	try {
		const { value, parameters } = parseNegotiationItem(item);
		return { value: value.toLowerCase(), parameters };
	} catch {
		return { value: item.toLowerCase(), parameters: {} };
	}
};

/** The charset parameter value is case-insensitive (RFC 7231 §3.1.1.2). */
const isSameParameter = (name: string, value1?: string, value2?: string) =>
	name === "charset"
		? value1?.toLowerCase() === value2?.toLowerCase()
		: value1 === value2;

const matchesIdentifier = (
	value: string,
	pattern: string,
	backward: boolean,
	forward: boolean,
) => {
	if (backward && forward) {
		// @example */*
		return value.includes(pattern);
	}
	if (backward) {
		// @example */bbb
		return value.endsWith(pattern);
	}
	if (forward) {
		// @example aaa/*
		return value.startsWith(pattern);
	}
	// @example aaa/bbb
	return value === pattern;
};

const defaultMatcher = <Type extends string>(
	candidateList: ReadonlyArray<Type>,
	negotiateValue: string,
	rangeParameters: Readonly<Record<string, string>> = {},
): Type | null => {
	const backward = negotiateValue.startsWith("*");
	const forward = negotiateValue.endsWith("*");
	const pattern = negotiateValue
		.slice(backward ? 1 : 0, forward ? -1 : negotiateValue.length)
		.toLowerCase();
	const rangeParameterEntries = Object.entries(rangeParameters);
	for (const item of candidateList) {
		const { value, parameters } = parseAvailable(item);
		if (
			(negotiateValue === "*" ||
				matchesIdentifier(value, pattern, backward, forward)) &&
			rangeParameterEntries.every(([name, parameterValue]) =>
				isSameParameter(name, parameters[name], parameterValue),
			)
		) {
			return item;
		}
	}
	return null;
};

type Specificity = [wildcards: number, parameters: number, literals: number];

/**
 * Counts wildcards, parameters and literal characters of a range so that more
 * specific ranges win: `text/html;level=1` > `text/html` > `text/*` > `*\/*`,
 * `en-US` > `en` > `*`.
 */
const getSpecificity = (
	range: string,
	parameters: Readonly<Record<string, string>>,
): Specificity => {
	let wildcards = 0;
	for (const char of range) {
		if (char === "*") {
			wildcards += 1;
		}
	}
	return [wildcards, Object.keys(parameters).length, range.length - wildcards];
};

const isMoreSpecific = (
	[wildcards1, parameters1, literals1]: Specificity,
	[wildcards2, parameters2, literals2]: Specificity,
) => {
	if (wildcards1 !== wildcards2) {
		return wildcards1 < wildcards2;
	}
	if (parameters1 !== parameters2) {
		return parameters2 < parameters1;
	}
	return literals2 < literals1;
};

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
			specificity: getSpecificity(range.value, range.parameters),
		}),
	);
	let result: Value | null = null;
	let maxQ = 0;
	let minIndex = Number.POSITIVE_INFINITY;
	for (const available of availableValues) {
		let best: (typeof ranges)[number] | null = null;
		for (const range of ranges) {
			if (valueMatcher([available], range.value, range.parameters)) {
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
