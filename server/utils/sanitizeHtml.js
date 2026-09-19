const sanitizeHtml = require('sanitize-html');

// Whitelist approach: only allow tags/attributes React-Quill actually produces.
// Anything else (script, iframe, onerror=, javascript: URLs, etc.) is stripped.
// This is the server-side defense against stored XSS -- we never trust that
// the frontend sanitized the HTML before sending it.
const sanitize = (dirtyHtml = '') => {
  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https', 'data'],
    disallowedTagsMode: 'discard',
  });
};

// Strip all HTML tags and collapse whitespace -- used for excerpt generation.
const stripHtml = (html = '') => {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
};

module.exports = { sanitize, stripHtml };
