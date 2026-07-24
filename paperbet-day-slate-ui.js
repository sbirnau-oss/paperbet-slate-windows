/**
 * @description Deterministic HTML renderer for PaperBet day-slate dashboard tab
 * @type deterministic
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderFilter(name, options, selectedValue) {
  const renderedOptions = ['<option value="">all</option>']
    .concat(options.map((option) => `<option value="${escapeHtml(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHtml(option)}</option>`))
    .join('');

  return `
    <label>
      ${escapeHtml(name)}
      <select data-paperbet-filter="${escapeHtml(name)}">${renderedOptions}</select>
    </label>
  `;
}

function renderRow(row) {
  const rowClasses = [
    'paperbet-day-slate-row',
    `priority-${row.analysisPriority}`,
    row.refreshRequiredLabel === 'yes' ? 'refresh-required' : '',
    row.oddsLayerQuality === 'low_confidence' ? 'odds-low-confidence' : '',
    row.integrityFlags.length ? 'has-integrity-flags' : '',
  ].filter(Boolean).join(' ');

  return `
    <tr class="${rowClasses}">
      <td>${escapeHtml(row.match)}</td>
      <td>${escapeHtml(row.league)}</td>
      <td>${escapeHtml(row.kickoffBerlin)}</td>
      <td>${escapeHtml(row.windowOwner)}</td>
      <td>${escapeHtml(row.analysisPriority)}</td>
      <td>${escapeHtml(row.mlAvailableLabel)}</td>
      <td>${escapeHtml(row.oddsLayerQuality)}</td>
      <td>${escapeHtml(row.refreshRequiredLabel)}</td>
      <td>${escapeHtml(row.integrityFlags.join(', ') || '—')}</td>
    </tr>
  `;
}

function renderPaperBetDaySlateSection(model) {
  if (!model || model.empty) {
    return `
      <section class="paperbet-day-slate-panel">
        <h2>🗓️ PaperBet Day Slate</h2>
        <p class="paperbet-day-slate-empty">${escapeHtml(model?.emptyMessage || 'No morning day-slate available yet.')}</p>
      </section>
    `;
  }

  const filterBar = `
    <div class="paperbet-day-slate-filters">
      ${renderFilter('windowOwner', model.filters.windowOwner || [], model.selectedFilters.windowOwner)}
      ${renderFilter('analysisPriority', model.filters.analysisPriority || [], model.selectedFilters.analysisPriority)}
      ${renderFilter('refreshRequired', model.filters.refreshRequired || ['all', 'yes', 'no'], model.selectedFilters.refreshRequired)}
    </div>
  `;

  const shadowSummary = model.shadowSummary ? `
    <section class="paperbet-shadow-summary">
      <h3>Shadow observability</h3>
      <div class="paperbet-shadow-grid">
        <span>Current ML: ${escapeHtml(model.shadowSummary.currentMl)}</span>
        <span>Shadow ML: ${escapeHtml(model.shadowSummary.shadowMl)}</span>
        <span>Δ ML: ${escapeHtml(model.shadowSummary.deltaMl)}</span>
        <span>Current low integrity: ${escapeHtml(model.shadowSummary.currentLowIntegrity)}</span>
        <span>Shadow low integrity: ${escapeHtml(model.shadowSummary.shadowLowIntegrity)}</span>
        <span>Δ low integrity: ${escapeHtml(model.shadowSummary.deltaLowIntegrity)}</span>
      </div>
    </section>
  ` : '';

  const groups = model.groups.map((group) => `
    <section class="paperbet-day-slate-group">
      <h3>${escapeHtml(group.windowOwner)}</h3>
      <table class="paperbet-day-slate-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>League</th>
            <th>Kickoff</th>
            <th>Window</th>
            <th>Priority</th>
            <th>ML</th>
            <th>Odds</th>
            <th>Refresh</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>${group.rows.map(renderRow).join('')}</tbody>
      </table>
    </section>
  `).join('');

  return `
    <section class="paperbet-day-slate-panel">
      <h2>🗓️ PaperBet Day Slate</h2>
      <p>Operational day: ${escapeHtml(model.operationalDay)}</p>
      ${filterBar}
      <div class="paperbet-day-slate-summary">
        <span>Total: ${escapeHtml(model.summary.total)}</span>
        <span>High priority: ${escapeHtml(model.summary.highPriority)}</span>
        <span>Refresh required: ${escapeHtml(model.summary.refreshRequired)}</span>
      </div>
      ${shadowSummary}
      ${groups}
    </section>
  `;
}

const paperBetDaySlateUi = { renderPaperBetDaySlateSection };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = paperBetDaySlateUi;
}

if (typeof window !== 'undefined') {
  window.PaperBetDaySlateUi = paperBetDaySlateUi;
}
