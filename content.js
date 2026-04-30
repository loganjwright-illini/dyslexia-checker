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
    checkContrastRatio(),
    checkRedGreen(),
    checkCharacterSpacing(),
    checkBoldEmphasis(),
    checkMultipleColumns(),
    checkHyphenation(),
    checkParagraphIndentation(),
    checkHeadingHierarchy(),
    checkHeadingFrequency(),
    checkCustomizationOptions(),
  ];
}

// --- Highlight system ---

function applyHighlights() {
  injectStyles();

  // first pass: accumulate classes and labels onto elements
  store.forEach(({ status, elements }, label) => {
    if (status === 'pass' || !elements) return;
    const cls = status === 'fail' ? 'dac-fail' : 'dac-warn';
    elements.forEach((el) => {
      el.classList.add('dac-highlight', cls);
      const existing = el.dataset.dacLabel;
      el.dataset.dacLabel = existing ? `${existing}, ${label}` : label;
    });
  });

  // second pass: insert one badge per element
  document.querySelectorAll('.dac-highlight').forEach((el) => {
    const badge = document.createElement('span');
    const cls = el.classList.contains('dac-fail') ? 'dac-fail' : 'dac-warn';
    badge.className = `dac-badge ${cls}`;
    badge.textContent = el.dataset.dacLabel;
    el.insertBefore(badge, el.firstChild);
  });
}

function clearHighlights() {
  document.querySelectorAll('.dac-highlight').forEach((el) => {
    el.classList.remove('dac-highlight', 'dac-fail', 'dac-warn');
    delete el.dataset.dacLabel;
  });
  document.querySelectorAll('.dac-badge').forEach((el) => el.remove());
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
    .dac-badge {
      display: inline-block;
      font-family: Arial, sans-serif !important;
      font-size: 11px !important;
      font-style: normal !important;
      font-weight: bold !important;
      text-transform: none !important;
      white-space: nowrap;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 999999;
      color: #fff !important;
      margin-right: 6px;
      vertical-align: middle;
    }
    .dac-badge.dac-fail { background-color: #d32f2f; }
    .dac-badge.dac-warn { background-color: #f57c00; }
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
    return size > 0 && size < 16;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'All text meets the 16px minimum.');
  }

  const smallest = Math.min(...failing.map((el) => parseFloat(getComputedStyle(el).fontSize)));
  const status = smallest >= 14 ? 'warn' : 'fail';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) below 16px (smallest: ${smallest}px).`);
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
  const candidates = [
    document.body,
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('#content, .content, [role="main"]'),
  ].filter(Boolean);

  function parseRgb(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  function isNearWhite(rgb) {
    return rgb && rgb[0] >= 240 && rgb[1] >= 240 && rgb[2] >= 240;
  }

  const failing = candidates.filter((el) => {
    const rgb = parseRgb(getComputedStyle(el).backgroundColor);
    return isNearWhite(rgb);
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', `Background color looks good.`);
  }

  const isPureWhite = failing.some((el) => {
    const rgb = parseRgb(getComputedStyle(el).backgroundColor);
    return rgb && rgb[0] === 255 && rgb[1] === 255 && rgb[2] === 255;
  });

  save(label, 'fail', failing);
  return result(
    label,
    'fail',
    isPureWhite
      ? 'Pure white background detected — cream or pastel recommended.'
      : 'Near-white background detected — cream or pastel recommended.'
  );
}

function checkTextColor() {
  const label = 'Text Color';
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, td, a')].filter(
    (el) => el.innerText?.trim()
  );
  const sample = els.length > 0 ? els : [document.body];

  function isPureBlack(colorStr) {
    return colorStr === 'rgb(0, 0, 0)' || colorStr === 'rgba(0, 0, 0, 1)';
  }

  const failing = sample.filter((el) => isPureBlack(getComputedStyle(el).color));

  if (failing.length === 0) {
    const color = getComputedStyle(sample[0]).color;
    save(label, 'pass', []);
    return result(label, 'pass', `Text color: ${color}`);
  }

  const ratio = failing.length / sample.length;
  const status = ratio > 0.3 ? 'fail' : 'warn';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) use pure black text — dark grey or navy recommended.`);
}


function checkRedGreen() {
  const label = 'Red/Green Colors';
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, a, button, td, span')].filter(
    (el) => el.innerText?.trim()
  );

  function parseRgb(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  function isRed(rgb) {
    return rgb && rgb[0] > 150 && rgb[1] < 100 && rgb[2] < 100;
  }

  function isGreen(rgb) {
    return rgb && rgb[1] > 150 && rgb[0] < 100 && rgb[2] < 100;
  }

  const failing = els.filter((el) => {
    const fg = parseRgb(getComputedStyle(el).color);
    const bg = parseRgb(getComputedStyle(el).backgroundColor);
    return (isRed(fg) && isGreen(bg)) || (isGreen(fg) && isRed(bg));
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No red/green color combinations detected.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) use red/green color combinations.`);
}

function checkCharacterSpacing() {
  const label = 'Character Spacing';
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')].filter(
    (el) => el.innerText?.trim()
  );

  if (els.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No text elements found.');
  }

  const failing = els.filter((el) => {
    const ls = parseFloat(getComputedStyle(el).letterSpacing);
    if (isNaN(ls)) return false;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const ratio = ls / fs;
    return ratio < -0.05 || ratio > 0.12;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'Character spacing looks good.');
  }
  const status = failing.length / els.length > 0.3 ? 'fail' : 'warn';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) have tight or wide character spacing.`);
}


function checkMultipleColumns() {
  const label = 'Multiple Columns';
  const els = [...document.querySelectorAll('*')];
  const failing = els.filter((el) => {
    const style = getComputedStyle(el);
    const colCount = parseInt(style.columnCount);
    return !isNaN(colCount) && colCount > 1;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No multiple-column layouts detected.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) use multiple CSS columns.`);
}

function checkHyphenation() {
  const label = 'Hyphenation';
  const els = [...document.querySelectorAll('p, li, div, article, section')];
  const failing = els.filter((el) => {
    const h = getComputedStyle(el).hyphens;
    return h === 'auto';
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No automatic hyphenation detected.');
  }
  save(label, 'fail', failing);
  return result(label, 'fail', `${failing.length} element(s) have hyphenation enabled.`);
}

function checkParagraphIndentation() {
  const label = 'Paragraph Indentation';
  const els = [...document.querySelectorAll('p')].filter((el) => el.innerText?.trim());
  const failing = els.filter((el) => {
    const indent = parseFloat(getComputedStyle(el).textIndent);
    return !isNaN(indent) && Math.abs(indent) > 10;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No paragraph indentation detected.');
  }
  save(label, 'warn', failing);
  return result(label, 'warn', `${failing.length} paragraph(s) use text indentation — use spacing instead.`);
}

function checkHeadingHierarchy() {
  const label = 'Heading Hierarchy';
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];

  if (headings.length === 0) {
    save(label, 'warn', []);
    return result(label, 'warn', 'No headings found — clear heading structure recommended.');
  }

  const skipped = [];
  let prevLevel = 0;
  headings.forEach((el) => {
    const level = parseInt(el.tagName[1]);
    if (prevLevel > 0 && level > prevLevel + 1) skipped.push(el);
    prevLevel = level;
  });

  const h1s = headings.filter((el) => el.tagName === 'H1');
  if (h1s.length > 1) {
    save(label, 'warn', h1s);
    return result(label, 'warn', `${h1s.length} H1 elements found — page should have only one.`);
  }

  if (skipped.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'Heading hierarchy is correct.');
  }
  save(label, 'fail', skipped);
  return result(label, 'fail', `${skipped.length} heading(s) skip levels in the hierarchy.`);
}

function checkContrastRatio() {
  const label = 'Contrast Ratio';
  const els = [...document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')].filter(
    (el) => el.innerText?.trim()
  );

  if (els.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No text elements found.');
  }

  function parseRgb(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }

  function relativeLuminance({ r, g, b }) {
    const ch = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  function contrastRatio(rgb1, rgb2) {
    const l1 = relativeLuminance(rgb1);
    const l2 = relativeLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function resolveBackground(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = parseRgb(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 }; // fallback to white
  }

  const lowContrast = [];
  const highContrast = [];

  els.forEach((el) => {
    const fg = parseRgb(getComputedStyle(el).color);
    const bg = resolveBackground(el);
    if (!fg) return;
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) lowContrast.push(el);
    else if (ratio > 15) highContrast.push(el); // pure black on white is ~21
  });

  if (lowContrast.length > 0) {
    save(label, 'fail', lowContrast);
    return result(label, 'fail', `${lowContrast.length} element(s) have insufficient contrast (below 4.5:1).`);
  }
  if (highContrast.length > 0) {
    save(label, 'warn', highContrast);
    return result(label, 'warn', `${highContrast.length} element(s) have very high contrast — slightly softer recommended.`);
  }
  save(label, 'pass', []);
  return result(label, 'pass', 'Contrast ratios look good.');
}

function checkBoldEmphasis() {
  const label = 'Bold Emphasis';
  const els = [...document.querySelectorAll('p, li')].filter((el) => el.innerText?.trim());

  if (els.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No paragraph text found.');
  }

  const failing = els.filter((el) => {
    const weight = getComputedStyle(el).fontWeight;
    return parseInt(weight) >= 700;
  });

  if (failing.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No fully bold paragraphs detected.');
  }
  const status = failing.length / els.length > 0.3 ? 'fail' : 'warn';
  save(label, status, failing);
  return result(label, status, `${failing.length} element(s) are entirely bold — use bold only for emphasis.`);
}


function checkHeadingFrequency() {
  const label = 'Heading Frequency';

  // walk the body's children in order, accumulating word counts between headings
  const headingTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
  const blocks = [];
  let wordCount = 0;
  let elements = [];

  function countWords(el) {
    return (el.innerText || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function walk(node) {
    if (headingTags.has(node.tagName)) {
      if (wordCount > 0) blocks.push({ wordCount, elements: [...elements] });
      wordCount = 0;
      elements = [];
    } else if (node.tagName === 'P' || node.tagName === 'LI') {
      const w = countWords(node);
      if (w > 0) { wordCount += w; elements.push(node); }
    } else {
      for (const child of node.children) walk(child);
      return;
    }
    for (const child of node.children) walk(child);
  }

  for (const child of document.body.children) walk(child);
  if (wordCount > 0) blocks.push({ wordCount, elements: [...elements] });

  if (blocks.length === 0) {
    save(label, 'pass', []);
    return result(label, 'pass', 'No large text sections found.');
  }

  const WARN_THRESHOLD = 200;
  const FAIL_THRESHOLD = 350;

  const failing = blocks.filter((b) => b.wordCount > FAIL_THRESHOLD);
  const warning = blocks.filter((b) => b.wordCount > WARN_THRESHOLD && b.wordCount <= FAIL_THRESHOLD);

  if (failing.length > 0) {
    const worst = Math.max(...failing.map((b) => b.wordCount));
    const els = failing.flatMap((b) => b.elements);
    save(label, 'fail', els);
    return result(label, 'fail', `${failing.length} section(s) exceed ${FAIL_THRESHOLD} words without a heading (longest: ${worst} words).`);
  }
  if (warning.length > 0) {
    const worst = Math.max(...warning.map((b) => b.wordCount));
    const els = warning.flatMap((b) => b.elements);
    save(label, 'warn', els);
    return result(label, 'warn', `${warning.length} section(s) exceed ${WARN_THRESHOLD} words without a heading (longest: ${worst} words).`);
  }
  save(label, 'pass', []);
  return result(label, 'pass', 'Headings appear frequently enough.');
}

function checkCustomizationOptions() {
  const label = 'Customization Options';

  const keywords = ['font', 'size', 'color', 'colour', 'contrast', 'theme', 'spacing', 'accessibility', 'dyslexia', 'text size'];

  function mentionsCustomization(el) {
    const text = (el.textContent || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();
    return keywords.some((k) => text.includes(k) || ariaLabel.includes(k) || title.includes(k));
  }

  // look for interactive controls related to customization
  const controls = [
    ...document.querySelectorAll('button, select, input[type="range"], input[type="color"], [role="button"]'),
  ].filter(mentionsCustomization);

  // also look for accessibility/settings panels by common class/id patterns
  const panels = [...document.querySelectorAll(
    '[class*="access"], [class*="dyslexia"], [class*="theme"], [id*="access"], [id*="settings"], [id*="toolbar"]'
  )];

  if (controls.length > 0 || panels.length > 0) {
    save(label, 'pass', []);
    return result(label, 'pass', `Customization controls detected (${controls.length} control(s), ${panels.length} panel(s)).`);
  }

  save(label, 'warn', []);
  return result(label, 'warn', 'No customization controls found — font, size, color, and spacing options recommended.');
}

function result(label, status, message) {
  return { label, status, message };
}
