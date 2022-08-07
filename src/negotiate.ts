import {parseAcceptStatements} from './parseAcceptStatements';

export interface NegotiateMatcher<Type extends string> {
    (arr: ReadonlyArray<Type>, value: string): Type | null | undefined,
}

const defaultMatcher = <Type extends string>(
    candidateList: ReadonlyArray<Type>,
    negotiateValue: string,
): Type | null | undefined => {
    for (const value of candidateList) {
        if (value === negotiateValue) {
            return value;
        }
    }
    return null;
};

/**
 * https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3
 * Parses an "Accept-*" value and return the result of negotiation.
 */
export const negotiate = <Value extends string>(
    availableValues: ReadonlyArray<Value>,
    acceptStatements: string,
    valueMatcher: NegotiateMatcher<Value> = defaultMatcher,
): Value | null => {
    let result: Value | null = null;
    let maxQ = 0;
    for (const {value, q} of parseAcceptStatements(acceptStatements, true)) {
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
