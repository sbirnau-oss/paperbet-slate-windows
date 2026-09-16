/**
 * @description Deterministic HTML renderer for PaperBet day-slate dashboard tab
 * @type deterministic
 */

(function exposePaperBetDaySlateUi(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.PaperBetDaySlateUi = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPaperBetDaySlateUi() {
  'use strict';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderFilter(name, label, options, selectedValue) {
  const renderedOptions = ['<option value="">all</option>']
    .concat(options.map((option) => `<option value="${escapeHtml(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHtml(option)}</option>`))
    .join('');

  return `
    <label>
      ${escapeHtml(label)}
      <select data-paperbet-filter="${escapeHtml(name)}">${renderedOptions}</select>
    </label>
  `;
}

function renderRow(row) {
  const leaguePriority = row.leaguePriority || 'unknown';
  const analysisPriority = row.analysisPriority || 'unknown';
  const coveragePolicy = row.coveragePolicy || 'unknown';
  const competitionPriorityClass = ['high', 'medium', 'low'].includes(leaguePriority)
    ? leaguePriority
    : 'unknown';
  const analysisPriorityClass = ['high', 'medium', 'low'].includes(analysisPriority)
    ? row.analysisPriority
    : 'unknown';
  const rowClasses = [
    'paperbet-day-slate-row',
    `competition-priority-${competitionPriorityClass}`,
    `analysis-priority-${analysisPriorityClass}`,
    `priority-${analysisPriorityClass}`,
    row.refreshRequiredLabel === 'yes' ? 'refresh-required' : '',
    row.oddsLayerQuality === 'low_confidence' ? 'odds-low-confidence' : '',
    Array.isArray(row.integrityFlags) && row.integrityFlags.length ? 'has-integrity-flags' : '',
  ].filter(Boolean).join(' ');

  return `
    <tr class="${rowClasses}">
      <td>${escapeHtml(row.match)}</td>
      <td>${escapeHtml(row.league)}</td>
      <td>${escapeHtml(row.kickoffBerlin)}</td>
      <td>${escapeHtml(row.windowOwner)}</td>
      <td>${escapeHtml(leaguePriority)}</td>
      <td>${escapeHtml(analysisPriority)}</td>
      <td>${escapeHtml(coveragePolicy)}</td>
      <td>${escapeHtml(row.mlAvailableLabel)}</td>
      <td>${escapeHtml(row.oddsLayerQuality)}</td>
      <td>${escapeHtml(row.refreshRequiredLabel)}</td>
      <td>${escapeHtml((Array.isArray(row.integrityFlags) && row.integrityFlags.join(', ')) || '—')}</td>
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
      ${renderFilter('windowOwner', 'Window owner', model.filters.windowOwner || [], model.selectedFilters.windowOwner)}
      ${renderFilter('leaguePriority', 'Competition priority', model.filters.leaguePriority || [], model.selectedFilters.leaguePriority)}
      ${renderFilter('analysisPriority', 'Analysis readiness', model.filters.analysisPriority || [], model.selectedFilters.analysisPriority)}
      ${renderFilter('refreshRequired', 'Refresh required', model.filters.refreshRequired || ['all', 'yes', 'no'], model.selectedFilters.refreshRequired)}
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
            <th>Competition priority</th>
            <th>Analysis readiness</th>
            <th>Coverage policy</th>
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

  const publicationWarnings = (model.publicationWarnings || [])
    .filter((warning) => warning.reason === 'required_full_odds_incomplete')
    .map((warning) => `<p class="paperbet-publication-warning" role="status">⚠️ Warning: incomplete odds for ${escapeHtml(warning.missing_required_full)} required-coverage fixtures (${escapeHtml(warning.required_full_complete)}/${escapeHtml(warning.required_full_total)} complete). Publication is allowed; affected fixtures still require odds refresh before pick decisions. Fixture IDs: ${escapeHtml((warning.fixture_ids || []).join(', '))}.</p>`)
    .join('');

  return `
    <section class="paperbet-day-slate-panel">
      <h2>🗓️ PaperBet Day Slate</h2>
      <p>Operational day: ${escapeHtml(model.operationalDay)}</p>
      ${publicationWarnings}
      ${filterBar}
      <div class="paperbet-day-slate-summary">
        <span>Total: ${escapeHtml(model.summary.total)}</span>
        <span>High-competition fixtures: ${escapeHtml(model.summary.highCompetitionPriority ?? 0)}</span>
        <span>High analysis readiness: ${escapeHtml(model.summary.highAnalysisReadiness ?? model.summary.highPriority ?? 0)}</span>
        <span>Refresh required: ${escapeHtml(model.summary.refreshRequired)}</span>
      </div>
      ${shadowSummary}
      ${groups}
    </section>
  `;
}

  return { renderPaperBetDaySlateSection };
});
