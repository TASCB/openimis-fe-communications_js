// Dependency-free HTML sanitizer for feed post bodies (render-time defence in depth).
//
// The backend `sanitize.py` (bleach) is the authoritative guard on write; this pass keeps
// the allow-list honest at render time without pulling a JS dependency through rollup.
// It parses with the browser's own DOMParser (never regex) and walks the tree, so it
// avoids the tokenizer bugs that sink hand-rolled sanitizers.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'DIV', 'SPAN',
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP',
  'A', 'UL', 'OL', 'LI',
  'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'FONT', 'IMG',
]);
// Tags dropped together with their contents (never merely unwrapped).
const DROP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META',
  'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'NOSCRIPT',
]);
const ALLOWED_ATTR = {
  A: ['href', 'title', 'target', 'rel'],
  IMG: ['src', 'alt', 'width', 'height'],
  FONT: ['color'],
};
const GLOBAL_ATTR = ['style'];
const URL_ATTR = { A: 'href', IMG: 'src' };
const ALLOWED_STYLE = new Set([
  'color', 'background-color', 'text-align', 'text-decoration', 'font-weight', 'font-style',
]);

function safeUrl(value) {
  const v = (value || '').trim();
  // Block script-y schemes; allow http(s), mailto, and relative/same-origin URLs.
  // eslint-disable-next-line no-script-url
  if (/^(javascript|data|vbscript):/i.test(v)) return null;
  return v;
}

function cleanStyle(el) {
  const raw = el.getAttribute('style');
  if (!raw) return;
  const kept = [];
  raw.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx < 0) return;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!ALLOWED_STYLE.has(prop)) return;
    if (/url\(|expression|javascript:/i.test(val)) return;
    kept.push(`${prop}: ${val}`);
  });
  if (kept.length) el.setAttribute('style', kept.join('; '));
  else el.removeAttribute('style');
}

function cleanAttrs(el) {
  const tag = el.tagName;
  const allowed = ALLOWED_ATTR[tag] || [];
  Array.from(el.attributes).forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (!allowed.includes(name) && !GLOBAL_ATTR.includes(name)) {
      el.removeAttribute(attr.name);
      return;
    }
    if (URL_ATTR[tag] === name) {
      const url = safeUrl(attr.value);
      if (url === null) el.removeAttribute(attr.name);
      else el.setAttribute(attr.name, url);
    }
  });
  if (el.getAttribute('style') != null) cleanStyle(el);
  if (tag === 'A' && el.getAttribute('target') === '_blank') {
    el.setAttribute('rel', 'noopener noreferrer');
  }
}

function walk(node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) return;
    if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); return; }
    const tag = child.tagName;
    if (DROP_TAGS.has(tag)) { child.remove(); return; }
    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown wrapper: keep the text/children, drop the element itself.
      walk(child);
      while (child.firstChild) node.insertBefore(child.firstChild, child);
      child.remove();
      return;
    }
    cleanAttrs(child);
    walk(child);
  });
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstChild;
  if (!root) return '';
  walk(root);
  return root.innerHTML;
}

// Visible-text length, used for the composer character count / validity (HTML tags don't count).
export function htmlToText(html) {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\u00a0/g, ' ').trim();
}
