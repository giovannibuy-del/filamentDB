function decodeEntities(value) {
  if (!value) {
    return '';
  }

  const entities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"'
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, entity) => entities[entity.toLowerCase()] || `&${entity};`)
    .trim();
}

function getMetaContent(html, propertyNames) {
  for (const propertyName of propertyNames) {
    const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return decodeEntities(match[1]);
      }
    }
  }

  return '';
}

function getTitle(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return decodeEntities(title?.replace(/\s+/g, ' '));
}

function parseMakerWorldMetadata(html, url) {
  const title = getMetaContent(html, ['og:title', 'twitter:title']) || getTitle(html) || 'MakerWorld Druckauftrag';
  const description = getMetaContent(html, ['og:description', 'twitter:description', 'description']);
  const image = getMetaContent(html, ['og:image', 'twitter:image']);
  const author = getMetaContent(html, ['author', 'article:author']);

  return {
    source: 'MakerWorld',
    title,
    description,
    image,
    author,
    url
  };
}

function isSupportedPrintLink(value) {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);
    return ['makerworld.com', 'www.makerworld.com'].includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

module.exports = {
  decodeEntities,
  isSupportedPrintLink,
  parseMakerWorldMetadata
};
