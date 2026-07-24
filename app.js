(function () {
  'use strict';

  const AAD = new TextEncoder().encode('paperbet-day-slate-v1');
  const state = {
    envelope: null,
    model: null,
    selectedFilters: {
      windowOwner: '',
      analysisPriority: '',
      refreshRequired: 'all',
    },
  };

  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }

  async function decryptEnvelope(envelope, passphrase) {
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: envelope.kdf.hash,
        salt: base64ToBytes(envelope.kdf.salt),
        iterations: envelope.kdf.iterations,
      },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(envelope.cipher.iv),
        additionalData: AAD,
        tagLength: 128,
      },
      key,
      base64ToBytes(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  function applyFilters(model) {
    if (!model || model.empty) return model;
    const selected = state.selectedFilters;
    const rows = model.rows.filter(row => {
      if (selected.windowOwner && row.windowOwner !== selected.windowOwner) return false;
      if (selected.analysisPriority && row.analysisPriority !== selected.analysisPriority) return false;
      if (selected.refreshRequired !== 'all' && row.refreshRequiredLabel !== selected.refreshRequired) return false;
      return true;
    });
    const groups = [...new Set(rows.map(row => row.windowOwner))]
      .sort()
      .map(windowOwner => ({ windowOwner, rows: rows.filter(row => row.windowOwner === windowOwner) }));
    return {
      ...model,
      selectedFilters: { ...selected },
      rows,
      groups,
      summary: {
        total: rows.length,
        highPriority: rows.filter(row => row.analysisPriority === 'high').length,
        refreshRequired: rows.filter(row => row.refreshRequiredLabel === 'yes').length,
      },
    };
  }

  function renderSlate() {
    const root = document.getElementById('slate-root');
    root.innerHTML = window.PaperBetDaySlateUi.renderPaperBetDaySlateSection(applyFilters(state.model));
    root.hidden = false;
    document.getElementById('unlock-panel').hidden = true;
    root.querySelectorAll('[data-paperbet-filter]').forEach(select => {
      select.addEventListener('change', () => {
        state.selectedFilters[select.dataset.paperbetFilter] = select.value;
        renderSlate();
      });
    });
  }

  async function unlock(passphrase) {
    const error = document.getElementById('unlock-error');
    error.textContent = '';
    if (!state.envelope) {
      error.textContent = 'Payload-ul criptat încă se încarcă.';
      return;
    }
    try {
      state.model = await decryptEnvelope(state.envelope, passphrase);
      sessionStorage.setItem('paperbet-slate-key', passphrase);
      renderSlate();
    } catch {
      error.textContent = 'Cheie incorectă sau payload corupt.';
    }
  }

  async function loadEnvelope() {
    const response = await fetch(`data/slate.enc.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.envelope = await response.json();
    document.getElementById('publication-meta').textContent =
      `Zi operațională: ${state.envelope.operational_day} · publicat: ${new Date(state.envelope.published_at).toLocaleString('ro-RO')}`;
    document.getElementById('passphrase').disabled = false;
    document.getElementById('unlock-button').disabled = false;
    const remembered = sessionStorage.getItem('paperbet-slate-key');
    if (remembered) await unlock(remembered);
  }

  document.getElementById('unlock-form').addEventListener('submit', event => {
    event.preventDefault();
    unlock(document.getElementById('passphrase').value);
  });

  loadEnvelope().catch(err => {
    document.getElementById('publication-meta').textContent = `Payload indisponibil: ${err.message}`;
  });
})();
