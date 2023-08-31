import { parseNegotiationItem } from './parseNegotiationItem.mjs';

test('accept text/html', () => {
  expect(parseNegotiationItem('text/html')).toMatchObject({
    value: 'text/html',
    parameters: {},
  });
});
test('accept text/*', () => {
  expect(parseNegotiationItem('text/*')).toMatchObject({
    value: 'text/*',
    parameters: {},
  });
});
test('accept */*', () => {
  expect(parseNegotiationItem('*/*')).toMatchObject({
    value: '*/*',
    parameters: {},
  });
});
test('accept /html', () => {
  expect(parseNegotiationItem('/html')).toMatchObject({
    value: '/html',
    parameters: {},
  });
});
test('reject sparse string', () => {
  expect(() => {
    parseNegotiationItem(' text/html');
  }).toThrow(/^InvalidValue/);
});
test('reject empty parameter', () => {
  expect(() => {
    parseNegotiationItem('text/html;');
  }).toThrow(/^InvalidNegotiationParameter/);
});
test('accept a parameter', () => {
  expect(parseNegotiationItem('text/html; q=0.9 ')).toMatchObject({
    value: 'text/html',
    parameters: { q: '0.9' },
  });
});
test('reject second empty parameter', () => {
  expect(() => {
    parseNegotiationItem('text/html;q=0.9;');
  }).toThrow(/^InvalidNegotiationParameter/);
});
test('accept multiple parameters', () => {
  expect(parseNegotiationItem('text/html;q=0.9;p=0.8')).toMatchObject({
    value: 'text/html',
    parameters: { q: '0.9', p: '0.8' },
  });
});
test('reject spaces before equal signs', () => {
  expect(() => {
    parseNegotiationItem('text/html;q=0.9;p =0.8');
  }).toThrow(/^InvalidAttribute/);
});
test('reject spaces after equal signs', () => {
  expect(() => {
    parseNegotiationItem('text/html;q=0.9;p= 0.8');
  }).toThrow(/^InvalidAttributeValue/);
});
test('accept the boundary paramter', () => {
  expect(
    parseNegotiationItem(
      'multipart/form-data; boundary=----WebKitFormBoundaryBD30bQglmASNpNSt',
    ),
  ).toMatchObject({
    value: 'multipart/form-data',
    parameters: { boundary: '----WebKitFormBoundaryBD30bQglmASNpNSt' },
  });
});
