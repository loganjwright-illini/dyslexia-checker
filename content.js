const store = new Map(); // label -> { status, elements[] }

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'analyze') {
    clearHighlights();
    store.clear();
    sendResponse(analyzePage());
  } else if (message.action === 'highlight') {
    applyHighlights();
    sendResponse({ ok: true });
  } else if (message.action === 'clearHighlights') {
    clearHighlights();
    sendResponse({ ok: true });
  }
});

function analyzePage() {
  return [
    checkFontSize(),
    checkFontFamily(),
    checkLineHeight(),
    checkItalics(),
    checkAllCaps(),
    checkTextAlign(),
    checkBackgroundColor(),
    checkTextColor(),
    checkAltText(),
    checkRedGreen(),
  ];
}

// --- Highlight system ---

function applyHighlights() {
  injectStyles();
  store.forEach(({ status, elements }) => {
    if (status === 'pass' || !elements) return;
    const cls = status === 'fail' ? 'dac-fail' : 'dac-warn';
    elements.forEach((el) => el.classList.add('dac-highlight', cls));
  });
}

function clearHighlights() {
  document.querySelectorAll('.dac-highlight').forEach((el) => {
    el.classList.remove('dac-highlight', 'dac-fail', 'dac-warn');
  });
  const s = document.getElementById('dac-styles');
  if (s) s.remove();
}

function injectStyles() {
  if (document.getElementById('dac-styles')) return;
  const style = document.createElement('style');
  style.id = 'dac-styles';
  style.textContent = `
    .dac-highlight.dac-fail {
      outline: 3px solid #d32f2f !important;
      outline-offset: 2px;
      background-color: rgba(211, 47, 47, 0.08) !important;
    }
    .dac-highlight.dac-warn {
      outline: 3px solid #f57c00 !important;
      outline-offset: 2px;
      background-color: rgba(245, 124, 0, 0.08) !important;
    }
  `;
  document.head.appendChild(style);
}

function save(label, status, elements) {
  store.set(label, { status, elements });
}

// --- Checks ---

function checkFontSize() {
  const label = 'Font Size';
  const els = [...document.querySelectorAll('p, li, td, a, h1, h2, h3, h4, h5, h6')].filter(
    (el) => el.innerText?.trim()
  );
  const failing = els.filter((el) => {
    const size = parseFloat(getComputedStyle(el).fontSize);
    return size > 0 && size < 24;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'All text meets the 24px minimum.');
  }

  const smallest = Math.min(...failing.map((el) => parseFloat(getComputedStyle(el).fontSize)));
  const status = smallest >= 18 ? 'warn' : 'fail';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) below 24px (smallest: ${smallest}px).`);
}

function checkFontFamily() {
  const label = 'Font Family';
  const sansSerif = [
    'arial', 'open sans', 'verdana', 'helvetica', 'roboto', 'sans-serif',
    'lato', 'nunito', 'inter', 'system-ui', '-apple-system', 'segoe ui',
  ];
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, td')].filter(
    (el) => el.innerText?.trim()
  );

  if (els.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No text elements found.');
  }

  const failing = els.filter((el) => {
    const ff = getComputedStyle(el).fontFamily.toLowerCase();
    return !sansSerif.some((f) => ff.includes(f));
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'Sans-serif fonts detected.');
  }

  const ratio = failing.length / els.length;
  const status = ratio > 0.3 ? 'fail' : 'warn';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) use non-dyslexia-friendly fonts.`);
}

function checkLineHeight() {
  const label = 'Line Height';
  const els = [...document.querySelectorAll('p, li')].filter((el) => el.innerText?.trim());

  if (els.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No paragraph text found.');
  }

  function getRatio(el) {
    const style = getComputedStyle(el);
    const lh = style.lineHeight;
    const fs = parseFloat(style.fontSize);
    if (lh === 'normal' || !fs) return 1.2; // browser default
    return parseFloat(lh) / fs;
  }

  const failing = els.filter((el) => getRatio(el) < 1.5);
  const minRatio = Math.min(...els.map(getRatio));

  if (failing.length === 0) {
    const status = minRatio >= 2.0 ? 'pass' : 'warn';
    save(label, status, minRatio >= 2.0 ? [] : els.filter((el) => getRatio(el) < 2.0));
    return result(label, status, `Minimum ${minRatio.toFixed(2)}x — ${minRatio >= 2.0 ? 'ideal.' : 'meets minimum but 2x recommended.'}`);
  }

  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) have line height below 1.5 (minimum: ${minRatio.toFixed(2)}x).`);
}

function checkItalics() {
  const label = 'Italics';
  const els = [...document.querySelectorAll('p, li, a, h1, h2, h3, h4, h5, h6, em, i, td, span')];
  const failing = els.filter((el) => getComputedStyle(el).fontStyle === 'italic');

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No italic text detected.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) use italic text.`);
}

function checkAllCaps() {
  const label = 'All Caps';
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, a, button')];
  const failing = els.filter((el) => {
    if (getComputedStyle(el).textTransform === 'uppercase') return true;
    if (el.children.length > 0) return false;
    const text = el.textContent.trim();
    if (!text || text !== text.toUpperCase() || !/[A-Z]{2,}/.test(text)) return false;
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    // single short word is likely an abbreviation (CSS, HTML, API, etc.)
    if (words.length === 1 && text.length <= 5) return false;
    return true;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No all-caps text detected.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) use all-caps text.`);
}

function checkTextAlign() {
  const label = 'Text Alignment';
  const els = [...document.querySelectorAll('p, li, td, div, article, section')];
  const failing = els.filter((el) => getComputedStyle(el).textAlign === 'justify');

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No justified text found.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) use justified text alignment.`);
}

function checkBackgroundColor() {
  const label = 'Background Color';
  const bg = getComputedStyle(document.body).backgroundColor;
  const isWhite = bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)';
  if (isWhite) {
    save(label, 'fail', [document.body]);
    return result(label, 'fail', 'Pure white background — cream or pastel recommended.');
  }
  save(label, 'pass', []);
  return result(label, 'pass', `Background: ${bg}`);
}

function checkTextColor() {
  const label = 'Text Color';
  const color = getComputedStyle(document.body).color;
  const isBlack = color === 'rgb(0, 0, 0)' || color === 'rgba(0, 0, 0, 1)';
  if (isBlack) {
    save(label, 'fail', [document.body]);
    return result(label, 'fail', 'Pure black text — dark grey or navy recommended.');
  }
  save(label, 'pass', []);
  return result(label, 'pass', `Text color: ${color}`);
}

function checkAltText() {
  const label = 'Image Alt Text';
  const images = [...document.querySelectorAll('img')];
  const failing = images.filter((img) => !img.alt || img.alt.trim() === '');

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'All images have alt text.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} image(s) missing alt text.`);
}

function checkRedGreen() {
  const label = 'Red/Green Colors';
  save(label, 'warn', []);
  return result(label, 'warn', 'Manual check recommended for red/green color combinations.');
}

function result(label, status, message) {
  return { label, status, message };
}
