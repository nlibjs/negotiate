import { test } from 'node:test';
import * as assert from 'node:assert';
import { parseNegotiationItem } from './parseNegotiationItem.mjs';

test('accept text/html', () => {
  assert.deepStrictEqual(parseNegotiationItem('text/html'), {
    value: 'text/html',
    parameters: {},
  });
});
test('accept text/*', () => {
  assert.deepStrictEqual(parseNegotiationItem('text/*'), {
    value: 'text/*',
    parameters: {},
  });
});
test('accept */*', () => {
  assert.deepStrictEqual(parseNegotiationItem('*/*'), {
    value: '*/*',
    parameters: {},
  });
});
test('accept /html', () => {
  assert.deepStrictEqual(parseNegotiationItem('/html'), {
    value: '/html',
    parameters: {},
  });
});
test('reject sparse string', () => {
  assert.throws(
    () => parseNegotiationItem(' text/html'),
    /^Error: InvalidValue/,
  );
});
test('reject empty parameter', () => {
  assert.throws(
    () => parseNegotiationItem('text/html;'),
    /^Error: InvalidNegotiationParameter/,
  );
});
test('accept a parameter', () => {
  assert.deepStrictEqual(parseNegotiationItem('text/html; q=0.9 '), {
    value: 'text/html',
    parameters: { q: '0.9' },
  });
});
test('reject second empty parameter', () => {
  assert.throws(
    () => parseNegotiationItem('text/html;q=0.9;'),
    /^Error: InvalidNegotiationParameter/,
  );
});
test('accept multiple parameters', () => {
  assert.deepStrictEqual(parseNegotiationItem('text/html;q=0.9;p=0.8'), {
    value: 'text/html',
    parameters: { q: '0.9', p: '0.8' },
  });
});
test('reject spaces before equal signs', () => {
  assert.throws(
    () => parseNegotiationItem('text/html;q=0.9;p =0.8'),
    /^Error: InvalidAttribute/,
  );
});
test('reject spaces after equal signs', () => {
  assert.throws(
    () => parseNegotiationItem('text/html;q=0.9;p= 0.8'),
    /^Error: InvalidAttributeValue/,
  );
});
test('accept the boundary paramter', () => {
  assert.deepStrictEqual(
    parseNegotiationItem(
      'multipart/form-data; boundary=----WebKitFormBoundaryBD30bQglmASNpNSt',
    ),
    {
      value: 'multipart/form-data',
      parameters: { boundary: '----WebKitFormBoundaryBD30bQglmASNpNSt' },
    },
  );
});
