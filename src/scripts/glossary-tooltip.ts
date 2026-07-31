interface GlossaryEntry {
  term: string;
  def: string;
  slug?: string;
}

const popup = document.createElement('div');
popup.className = 'glossary-popup';
popup.setAttribute('role', 'tooltip');
popup.setAttribute('aria-hidden', 'true');
document.body.appendChild(popup);

function close() {
  popup.setAttribute('aria-hidden', 'true');
  popup.innerHTML = '';
  popup.classList.remove('glossary-popup--visible');
}

function show(span: HTMLElement) {
  const def = span.getAttribute('data-def');
  if (!def) return;
  const term = span.textContent || '';
  let html = `<strong>${term}</strong><p>${def}</p>`;
  const link = span.getAttribute('data-slug');
  if (link) html += `<a class="glossary-popup__link" href="/blog/${link}/">Читать подробнее →</a>`;
  popup.innerHTML = html;
  popup.classList.add('glossary-popup--visible');
  popup.setAttribute('aria-hidden', 'false');
  const rect = span.getBoundingClientRect();
  const pRect = popup.getBoundingClientRect();
  let top = rect.bottom + 8;
  if (top + pRect.height > window.innerHeight - 8) top = rect.top - pRect.height - 8;
  let left = rect.left;
  if (left + pRect.width > window.innerWidth - 8) left = window.innerWidth - pRect.width - 8;
  if (left < 8) left = 8;
  popup.style.top = `${top + window.scrollY}px`;
  popup.style.left = `${left}px`;
}

const terms: GlossaryEntry[] = (() => {
  const el = document.getElementById('glossary-data');
  if (!el) return [];
  try {
    return JSON.parse(el.textContent || '[]') as GlossaryEntry[];
  } catch {
    return [];
  }
})();

function wrapTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (!t.parentElement || t.parentElement.closest('script,style,code,pre,.glossary-term')) continue;
    textNodes.push(t);
  }
  for (const node of textNodes) {
    let text = node.textContent || '';
    let replaced = false;
    const fragments: (string | HTMLElement)[] = [];
    let last = 0;
    while (last < text.length) {
      let best: GlossaryEntry | null = null;
      let bestStart = text.length;
      for (const entry of terms) {
        const idx = text.indexOf(entry.term, last);
        if (idx !== -1 && idx < bestStart) {
          bestStart = idx;
          best = entry;
        }
      }
      if (!best) break;
      if (bestStart > last) fragments.push(text.slice(last, bestStart));
      const span = document.createElement('span');
      span.className = 'glossary-term';
      span.textContent = best.term;
      span.setAttribute('tabindex', '0');
      span.setAttribute('data-def', best.def);
      if (best.slug) span.setAttribute('data-slug', best.slug);
      fragments.push(span);
      last = bestStart + best.term.length;
      replaced = true;
    }
    if (replaced && last < text.length) fragments.push(text.slice(last));
    if (replaced) {
      const parent = node.parentElement!;
      for (const f of fragments) parent.insertBefore(typeof f === 'string' ? document.createTextNode(f) : f, node);
      parent.removeChild(node);
    }
  }
}

function bind() {
  document.querySelectorAll<HTMLElement>('.glossary-term').forEach(span => {
    const showThis = () => show(span);
    span.addEventListener('mouseenter', showThis);
    span.addEventListener('focus', showThis);
    span.addEventListener('click', showThis);
    span.addEventListener('mouseleave', close);
    span.addEventListener('blur', close);
  });
}

if (terms.length) {
  const article = document.querySelector('article');
  if (article) {
    wrapTextNodes(article);
    bind();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') close();
});
document.addEventListener('click', e => {
  if (!(e.target as HTMLElement).closest('.glossary-term')) close();
});
