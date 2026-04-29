chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'analyze' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      document.getElementById('loading').textContent = 'Could not analyze this page.';
      return;
    }
    displayResults(response);
  });
});

function displayResults(results) {
  const list = document.getElementById('results-list');
  const scoreDisplay = document.getElementById('score-display');
  list.innerHTML = '';

  let passed = 0;
  results.forEach((result) => {
    if (result.status === 'pass') passed++;
    const li = document.createElement('li');
    li.className = result.status;
    li.textContent = `${statusIcon(result.status)} ${result.label}: ${result.message}`;
    list.appendChild(li);
  });

  const score = Math.round((passed / results.length) * 100);
  scoreDisplay.textContent = `${score} / 100`;
}

function statusIcon(status) {
  if (status === 'pass') return '✓';
  if (status === 'warn') return '⚠';
  return '✗';
}
