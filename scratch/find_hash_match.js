const crypto = require('crypto');

const hash = 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756';

const candidates = [
  'biz1234!', '1234', '12345678', 'admin1234!', 'robinhood1234!', 'robin1234!', '01090843778', '010-9084-3778', 'g-90843778', 'g-090843778', 'password', '123456', 'robinhood'
];

for (const c of candidates) {
  const h = crypto.createHash('sha256').update(c).digest('hex');
  if (h === hash) {
    console.log('MATCH FOUND:', c);
  }
}
