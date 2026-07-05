// api.js
async function apiFetch(url, options = {}) {
  const overlay = document.getElementById('loading-overlay');
  const messageEl = document.getElementById('loading-message');

  overlay.style.display = 'flex';
  messageEl.textContent = 'Loading...';

  const coldStartTimer = setTimeout(() => {
    messageEl.textContent = 'Server was inactive — waking it up now. This can take up to a minute...';
  }, 4000);

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), 65000);

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(coldStartTimer);
    clearTimeout(abortTimer);
    overlay.style.display = 'none';
    return response;

  } catch (err) {
    clearTimeout(coldStartTimer);
    clearTimeout(abortTimer);
    overlay.style.display = 'none';

    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}