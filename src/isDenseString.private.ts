import {createTypeChecker, isString} from '@nlib/typing';

const DenseStringRegExp = /^[^\s\x85\u180e\u200b-\u200d\u2060]+$/;
/** @internal */
export const isDenseString = createTypeChecker(
    'DenseString',
    (input: unknown): input is string => isString(input) && DenseStringRegExp.test(input),
);
