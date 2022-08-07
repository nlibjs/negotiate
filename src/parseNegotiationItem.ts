import {splitString} from '@nlib/typing';
import {isDenseString} from './isDenseString.private';

// eslint-disable-next-line @nlib/no-globals
const {Error} = globalThis;

export interface ParsedNegotiationItem {
    value: string,
    parameters: Record<string, string>,
}
/**
 * Parses `text/html;charset=utf-8;foo=1` and returns
 * `{value: 'text/html', parameters: {charset: 'utf-8', foo: '1'}}`
 * https://tools.ietf.org/html/rfc7231#section-3.1.1.1
 * ```abnf
 * media-type = type "/" subtype *( OWS ";" OWS parameter )
 * type       = token
 * subtype    = token
 * parameter      = token "=" ( token / quoted-string )
 * ```
 */
export const parseNegotiationItem = (input: string): ParsedNegotiationItem => {
    let index = 0;
    const semiColonIndex = (index = input.indexOf(';'));
    if (index < 0) {
        index = input.length;
    }
    const value = input.slice(0, index);
    if (!isDenseString(value)) {
        throw new Error('InvalidValue');
    }
    const parameters: Record<string, string> = {};
    if (0 < semiColonIndex) {
        for (const {value: parameter} of splitString(input.slice(semiColonIndex + 1) || ' ', ';')) {
            const equalIndex = parameter.indexOf('=');
            if (equalIndex < 0) {
                throw new Error('InvalidNegotiationParameter');
            }
            const attribute = parameter.slice(0, equalIndex).trimStart().toLowerCase();
            if (!isDenseString(attribute)) {
                throw new Error('InvalidAttribute');
            }
            let attributeValue = parameter.slice(equalIndex + 1).trimEnd();
            if (attributeValue.startsWith('"')) {
                if (attributeValue.endsWith('"')) {
                    attributeValue = attributeValue.slice(1, -1);
                } else {
                    throw new Error('InvalidQuote');
                }
            }
            if (!isDenseString(attributeValue)) {
                throw new Error('InvalidAttributeValue');
            }
            parameters[attribute] = attributeValue;
        }
    }
    return {value, parameters};
};
