import { parseAcceptStatements } from "./parseAcceptStatements.ts";

/**
 * Returns the item of `arr` matched by the range `value`, or null.
 * If several items match, return the preferred one. `negotiate` calls it
 * repeatedly with the remaining items to find every match of a range.
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
 * Ties are broken by the order of the ranges in the header, then by the
 * matcher's preference, then by the order of `availableValues`.
 */
export const negotiate = <Value extends string>(
	availableValues: ReadonlyArray<Value>,
	acceptStatements?: string | null,
	valueMatcher: NegotiateMatcher<Value> = defaultMatcher,
): Value | null => {
	if (!acceptStatements) {
		return null;
	}
	interface Match {
		q: number;
		index: number;
		rank: number;
		specificity: [number, number];
	}
	const bestMatches = new Map<Value, Match>();
	let index = 0;
	for (const range of parseAcceptStatements(acceptStatements, true)) {
		const specificity = getSpecificity(range.value);
		const remaining = [...availableValues];
		for (let rank = 0; 0 < remaining.length; rank++) {
			const matched = valueMatcher(remaining, range.value);
			const matchedIndex = matched ? remaining.indexOf(matched) : -1;
			if (matchedIndex < 0) {
				break;
			}
			remaining.splice(matchedIndex, 1);
			const best = bestMatches.get(matched as Value);
			if (
				!best ||
				isMoreSpecific(specificity, best.specificity) ||
				(!isMoreSpecific(best.specificity, specificity) && best.q < range.q)
			) {
				bestMatches.set(matched as Value, {
					q: range.q,
					index,
					rank,
					specificity,
				});
			}
		}
		index += 1;
	}
	let result: Value | null = null;
	let resultMatch: Match | null = null;
	for (const available of availableValues) {
		const match = bestMatches.get(available);
		if (
			match &&
			0 < match.q &&
			(!resultMatch ||
				resultMatch.q < match.q ||
				(resultMatch.q === match.q &&
					(match.index < resultMatch.index ||
						(match.index === resultMatch.index &&
							match.rank < resultMatch.rank))))
		) {
			result = available;
			resultMatch = match;
		}
	}
	return result;
};
