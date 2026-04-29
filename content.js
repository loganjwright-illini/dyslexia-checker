chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'analyze') {
    sendResponse(analyzePage());
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

function checkFontSize() {
  const els = document.querySelectorAll('p, li, span, td, div');
  let smallest = Infinity;
  els.forEach((el) => {
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size && size < smallest) smallest = size;
  });
  if (smallest === Infinity) return result('Font Size', 'pass', 'No text elements found.');
  if (smallest >= 24) return result('Font Size', 'pass', `Minimum ${smallest}px — meets 24px requirement.`);
  if (smallest >= 18) return result('Font Size', 'warn', `Minimum ${smallest}px — below recommended 24px.`);
  return result('Font Size', 'fail', `Minimum ${smallest}px — below 18px minimum.`);
}

function checkFontFamily() {
  const body = getComputedStyle(document.body).fontFamily.toLowerCase();
  const sansSerif = ['arial', 'open sans', 'verdana', 'helvetica', 'sans-serif'];
  const ok = sansSerif.some((f) => body.includes(f));
  return ok
    ? result('Font Family', 'pass', 'Sans-serif font detected.')
    : result('Font Family', 'fail', `Font "${body}" may not be dyslexia-friendly.`);
}

function checkLineHeight() {
  const lh = parseFloat(getComputedStyle(document.body).lineHeight);
  const fs = parseFloat(getComputedStyle(document.body).fontSize);
  const ratio = lh / fs;
  if (ratio >= 2.0) return result('Line Height', 'pass', `${ratio.toFixed(2)}x — ideal spacing.`);
  if (ratio >= 1.5) return result('Line Height', 'warn', `${ratio.toFixed(2)}x — meets minimum but 2x recommended.`);
  return result('Line Height', 'fail', `${ratio.toFixed(2)}x — below 1.5 minimum.`);
}

function checkItalics() {
  const els = document.querySelectorAll('*');
  for (const el of els) {
    if (getComputedStyle(el).fontStyle === 'italic') {
      return result('Italics', 'fail', 'Italic text found on page.');
    }
  }
  return result('Italics', 'pass', 'No italic text detected.');
}

function checkAllCaps() {
  const els = document.querySelectorAll('*');
  for (const el of els) {
    const style = getComputedStyle(el);
    if (style.textTransform === 'uppercase') {
      return result('All Caps', 'fail', 'All-caps text transform detected.');
    }
    if (el.children.length === 0 && el.textContent.trim().length > 3) {
      const text = el.textContent.trim();
      if (text === text.toUpperCase() && /[A-Z]{4,}/.test(text)) {
        return result('All Caps', 'fail', 'All-caps content detected.');
      }
    }
  }
  return result('All Caps', 'pass', 'No all-caps text detected.');
}

function checkTextAlign() {
  const els = document.querySelectorAll('p, li, td, div');
  for (const el of els) {
    if (getComputedStyle(el).textAlign === 'justify') {
      return result('Text Alignment', 'fail', 'Justified text detected — use left-aligned text.');
    }
  }
  return result('Text Alignment', 'pass', 'No justified text found.');
}

function checkBackgroundColor() {
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg === 'rgb(255, 255, 255)' || bg === '#ffffff') {
    return result('Background Color', 'fail', 'Pure white background — use cream or pastel.');
  }
  return result('Background Color', 'pass', `Background color: ${bg}`);
}

function checkTextColor() {
  const color = getComputedStyle(document.body).color;
  if (color === 'rgb(0, 0, 0)' || color === '#000000') {
    return result('Text Color', 'fail', 'Pure black text — use dark grey or navy.');
  }
  return result('Text Color', 'pass', `Text color: ${color}`);
}

function checkAltText() {
  const images = document.querySelectorAll('img');
  const missing = [...images].filter((img) => !img.alt || img.alt.trim() === '');
  if (missing.length === 0) return result('Image Alt Text', 'pass', 'All images have alt text.');
  return result('Image Alt Text', 'fail', `${missing.length} image(s) missing alt text.`);
}

function checkRedGreen() {
  // Placeholder — full implementation requires analyzing color pairs of text/background
  return result('Red/Green Colors', 'warn', 'Manual check recommended for red/green color combinations.');
}

function result(label, status, message) {
  return { label, status, message };
}
