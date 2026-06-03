const assert = require('node:assert/strict');
const test = require('node:test');
const { decodeEntities, isSupportedPrintLink, parseMakerWorldMetadata } = require('../src/shared/metadataParser');

test('recognizes MakerWorld links only', () => {
  assert.equal(isSupportedPrintLink('https://makerworld.com/de/models/123'), true);
  assert.equal(isSupportedPrintLink('https://www.makerworld.com/en/models/123'), true);
  assert.equal(isSupportedPrintLink('https://example.com/model/123'), false);
  assert.equal(isSupportedPrintLink('not a url'), false);
});

test('parses Open Graph metadata from MakerWorld html', () => {
  const html = `
    <html>
      <head>
        <meta property="og:title" content="Benchy &amp; Calibration" />
        <meta name="description" content="Fast print profile" />
        <meta property="og:image" content="https://cdn.example/benchy.png" />
        <meta name="author" content="Maker" />
      </head>
    </html>
  `;

  assert.deepEqual(parseMakerWorldMetadata(html, 'https://makerworld.com/models/1'), {
    source: 'MakerWorld',
    title: 'Benchy & Calibration',
    description: 'Fast print profile',
    image: 'https://cdn.example/benchy.png',
    author: 'Maker',
    url: 'https://makerworld.com/models/1'
  });
});

test('falls back to title when social metadata is missing', () => {
  const metadata = parseMakerWorldMetadata('<title>Fallback Title</title>', 'https://makerworld.com/models/2');
  assert.equal(metadata.title, 'Fallback Title');
});

test('decodes numeric and named html entities', () => {
  assert.equal(decodeEntities('A &#38; B &#x26; C &quot;D&quot;'), 'A & B & C "D"');
});
