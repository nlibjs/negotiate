import { parseAcceptStatements } from "./parseAcceptStatements.mjs";

export interface NegotiateMatcher<Type extends string> {
  (arr: ReadonlyArray<Type>, value: string): Type | null | undefined;
}

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
 * https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3
 * Parses an "Accept-*" value and return the result of negotiation.
 */
export const negotiate = <Value extends string>(
  availableValues: ReadonlyArray<Value>,
  acceptStatements?: string | null,
  valueMatcher: NegotiateMatcher<Value> = defaultMatcher,
): Value | null => {
  if (!acceptStatements) {
    return null;
  }
  let result: Value | null = null;
  let maxQ = 0;
  for (const { value, q } of parseAcceptStatements(acceptStatements, true)) {
    if (maxQ < q) {
      const matched = valueMatcher(availableValues, value);
      if (matched) {
        result = matched;
        maxQ = q;
        if (1 <= maxQ) {
          break;
        }
      }
    }
  }
  return result;
};
