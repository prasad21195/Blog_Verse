const slugify = require('slugify');
const crypto = require('crypto');

// Two users can create posts with the same title, so we append a short
// random suffix to guarantee uniqueness without a DB round-trip.
const generateSlug = (title) => {
  const base = slugify(title, { lower: true, strict: true }).slice(0, 80);
  const suffix = crypto.randomBytes(4).toString('hex'); // e.g. "a1b2c3d4"
  return `${base}-${suffix}`;
};

module.exports = generateSlug;
