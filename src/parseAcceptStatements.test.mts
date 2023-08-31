import { parseAcceptStatements } from './parseAcceptStatements.mjs';

test('parse the accept header', () => {
  const headerValue = 'text/html,application/xml;q=0.9,image/avif,*/*;q=0.8';
  const generator = parseAcceptStatements(headerValue);
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'text/html', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'application/xml', q: 0.9 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'image/avif', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: '*/*', q: 0.8 },
  });
  expect(generator.next()).toMatchObject({ done: true, value: undefined });
});

test('throw at an invalid q parameter', () => {
  const headerValue =
    'text/html,application/xml;q=0.9,image/avif,*/*;q=0.8,image/png;q=1.1';
  const generator = parseAcceptStatements(headerValue);
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'text/html', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'application/xml', q: 0.9 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'image/avif', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: '*/*', q: 0.8 },
  });
  expect(() => generator.next()).toThrow(/^InvalidQuality/);
});

test('ignore invalid q parameters if loose=true', () => {
  const headerValue =
    'text/html,application/xml;q=0.9,image/avif,*/*;q=0.8,image/png;q=1.1';
  const generator = parseAcceptStatements(headerValue, true);
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'text/html', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'application/xml', q: 0.9 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: 'image/avif', q: 1 },
  });
  expect(generator.next()).toMatchObject({
    done: false,
    value: { value: '*/*', q: 0.8 },
  });
  expect(generator.next()).toMatchObject({ done: true, value: undefined });
});
