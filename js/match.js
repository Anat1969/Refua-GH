// Hebrew-aware matching for the search bar. Pure functions, shared by the app and the safety gate.
// Rules (anat-design-language 2.8): match at word start, after the prefix letters ה ו ב כ ל מ ש;
// a word of up to 3 letters must match whole.
const PREFIX = 'הובכלמש';

export function normalize(t) {
  return String(t || '')
    .replace(/[֑-ׇ]/g, '')          // niqqud and cantillation
    .replace(/[׳'`"״]/g, '')
    .replace(/[^א-תa-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function variants(w) {
  const out = [w];
  if (w.length > 2 && PREFIX.includes(w[0])) out.push(w.slice(1));
  if (w.length > 3 && PREFIX.includes(w[0]) && PREFIX.includes(w[1])) out.push(w.slice(2));
  return out;
}

function wordMatches(qWord, tWord) {
  for (const q of variants(qWord)) {
    for (const t of variants(tWord)) {
      if (q === t) return true;
      if (t.length > 3 && q.startsWith(t)) return true;
    }
  }
  return false;
}

// True when every word of the term appears, in any order, among the query words.
export function termMatches(query, term) {
  const qWords = normalize(query).split(' ').filter(Boolean);
  const tWords = normalize(term).split(' ').filter(Boolean);
  if (!qWords.length || !tWords.length) return false;
  return tWords.every((t) => qWords.some((q) => wordMatches(q, t)));
}

// Emergency detection: every keyword group whose term appears in the query, in priority order.
export function detect(query, keywords) {
  return keywords.filter((k) => k.terms.some((t) => termMatches(query, t)));
}

// Free search: a query word matches a text word at its start (after prefixes).
export function textMatches(query, text) {
  const qWords = normalize(query).split(' ').filter(Boolean);
  const words = normalize(text).split(' ').filter(Boolean);
  if (!qWords.length) return false;
  return qWords.every((q) =>
    words.some((w) => variants(w).some((v) => (q.length <= 3 ? v === q : v.startsWith(q)))),
  );
}
