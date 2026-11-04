(() => {
  'use strict';

  const STORAGE_KEY = 'tono.personal.crm.v1';
  const APP_VERSION = 1;
  const STAGES = [
    { id: 'backlog', label: 'Por trabajar' },
    { id: 'qualification', label: 'Calificación' },
    { id: 'negotiation', label: 'Negociación' },
    { id: 'closing', label: 'Closing Deal' },
    { id: 'won', label: 'Ganado' },
    { id: 'lost', label: 'Perdido' },
  ];
  const CHANNELS = [
    { id: 'call', label: 'Llamada', symbol: '☎' },
    { id: 'direct_email', label: 'Correo directo', symbol: '✉' },
    { id: 'whatsapp', label: 'WhatsApp', symbol: '◉' },
    { id: 'visit', label: 'Visita', symbol: '⌂' },
  ];
  const INDUSTRY_COLORS = ['#1686cf', '#15966d', '#d19a28', '#8064c7', '#e06b57', '#36a6a1', '#71829b', '#cf5f99', '#88a746', '#4f6ea8'];
  const VIEW_LABELS = {
    dashboard: 'MI RITMO',
    kanban: 'PIPELINE',
    prospects: 'PROSPECTOS',
    campaigns: 'CAMPAÑAS YAMM',
    insights: 'LECTURAS',
    settings: 'AJUSTES',
  };
  const appView = document.getElementById('appView');
  const dialog = document.getElementById('appDialog');
  const toastRegion = document.getElementById('toastRegion');
  const csvInput = document.getElementById('csvFileInput');
  const jsonInput = document.getElementById('jsonFileInput');
  let currentView = 'dashboard';
  let selectedPeriod = 'day';
  let prospectFilter = { q: '', stage: 'all', page: 1 };
  let pendingImport = [];
  let draggingLeadId = null;

  function currentMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function makeDefaultState() {
    return {
      version: APP_VERSION,
      settings: {
        dailyQualificationTarget: 8,
        weeklyTargets: { qualification: 40, negotiation: 12, closing: 3 },
        monthOne: currentMonthKey(),
        monthlySellerTargets: [2, 4, 5, 6, 6],
      },
      prospects: [],
      campaigns: [],
    };
  }

  function shortText(value, limit = 140) {
    return typeof value === 'string' ? value.trim().slice(0, limit) : '';
  }

  function validDateString(value, fallback = new Date().toISOString()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function sanitizeState(input) {
    const base = makeDefaultState();
    if (!input || typeof input !== 'object') return base;
    const rawSettings = input.settings && typeof input.settings === 'object' ? input.settings : {};
    const goals = rawSettings.weeklyTargets && typeof rawSettings.weeklyTargets === 'object' ? rawSettings.weeklyTargets : {};
    const targetArray = Array.isArray(rawSettings.monthlySellerTargets) ? rawSettings.monthlySellerTargets : base.settings.monthlySellerTargets;
    const prospects = Array.isArray(input.prospects) ? input.prospects : [];
    const campaigns = Array.isArray(input.campaigns) ? input.campaigns : [];
    const allowedStages = new Set(STAGES.map((stage) => stage.id));
    const allowedChannels = new Set(CHANNELS.map((channel) => channel.id));
    const cleanProspects = prospects.map((lead) => {
      if (!lead || typeof lead !== 'object') return null;
      const stage = allowedStages.has(lead.stage) ? lead.stage : 'backlog';
      const stageHistory = Array.isArray(lead.stageHistory) ? lead.stageHistory.slice(-250).map((entry) => {
        if (!entry || !allowedStages.has(entry.stage)) return null;
        return { stage: entry.stage, at: validDateString(entry.at) };
      }).filter(Boolean) : [];
      const activities = Array.isArray(lead.activities) ? lead.activities.slice(-1000).map((activity) => {
        if (!activity || !allowedChannels.has(activity.channel)) return null;
        return {
          id: shortText(activity.id, 80) || makeId(),
          at: validDateString(activity.at),
          channel: activity.channel,
          connected: Boolean(activity.connected),
        };
      }).filter(Boolean) : [];
      const clean = {
        id: shortText(lead.id, 80) || makeId(),
        name: shortText(lead.name, 120),
        industry: shortText(lead.industry, 80) || 'Sin industria',
        stage,
        createdAt: validDateString(lead.createdAt),
        stageChangedAt: validDateString(lead.stageChangedAt || lead.createdAt),
        stageHistory,
        activities,
      };
      if (!clean.industry.includes('@')) return clean.name && !clean.name.includes('@') ? clean : null;
      clean.industry = 'Sin industria';
      return clean.name && !clean.name.includes('@') ? clean : null;
    }).filter(Boolean);
    const cleanCampaigns = campaigns.map((campaign) => {
      if (!campaign || typeof campaign !== 'object') return null;
      const sent = Math.max(0, Math.floor(Number(campaign.sent) || 0));
      const replies = Math.max(0, Math.min(sent, Math.floor(Number(campaign.replies) || 0)));
      const clean = {
        id: shortText(campaign.id, 80) || makeId(),
        label: shortText(campaign.label, 100),
        date: validDateString(campaign.date),
        industry: shortText(campaign.industry, 80) || 'Sin segmento',
        sent,
        replies,
      };
      return clean.label && !clean.label.includes('@') ? clean : null;
    }).filter(Boolean);
    const monthOne = /^\d{4}-\d{2}$/.test(rawSettings.monthOne) ? rawSettings.monthOne : base.settings.monthOne;
    return {
      version: APP_VERSION,
      settings: {
        dailyQualificationTarget: clampInt(rawSettings.dailyQualificationTarget, 1, 500, base.settings.dailyQualificationTarget),
        weeklyTargets: {
          qualification: clampInt(goals.qualification, 0, 10000, base.settings.weeklyTargets.qualification),
          negotiation: clampInt(goals.negotiation, 0, 10000, base.settings.weeklyTargets.negotiation),
          closing: clampInt(goals.closing, 0, 10000, base.settings.weeklyTargets.closing),
        },
        monthOne,
        monthlySellerTargets: [0, 1, 2, 3, 4].map((index) => clampInt(targetArray[index], 0, 1000, base.settings.monthlySellerTargets[index])),
      },
      prospects: cleanProspects,
      campaigns: cleanCampaigns,
    };
  }

  function clampInt(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return makeDefaultState();
      const parsed = JSON.parse(saved);
      const clean = sanitizeState(parsed);
      // Strip unknown/imported fields from older backups; only the approved local schema remains.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      return clean;
    } catch (error) {
      console.error('No fue posible leer el almacenamiento local.', error);
      return makeDefaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      state = sanitizeState(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      toast('No se pudo guardar. Exporta un respaldo y revisa el espacio del navegador.', 'error');
      console.error('No fue posible guardar en localStorage.', error);
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function stageLabel(id) {
    return STAGES.find((stage) => stage.id === id)?.label || 'Por trabajar';
  }

  function channelById(id) {
    return CHANNELS.find((channel) => channel.id === id) || CHANNELS[0];
  }

  function dateOnly(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function dateFromISOInput(value) {
    return new Date(`${value}T12:00:00`).toISOString();
  }

  function displayDate(value, options = { month: 'short', day: 'numeric' }) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-MX', options).format(date);
  }

  function displayDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function num(value) {
    return new Intl.NumberFormat('es-MX').format(Number(value) || 0);
  }

  function percentage(numerator, denominator) {
    return denominator > 0 ? `${Math.round((numerator / denominator) * 100)}%` : '—';
  }

  function startOfDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function startOfWeek(date = new Date()) {
    const start = startOfDay(date);
    const dayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayOffset);
    return start;
  }

  function startOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function periodBounds(period) {
    const now = new Date();
    const start = period === 'week' ? startOfWeek(now) : period === 'month' ? startOfMonth(now) : startOfDay(now);
    const end = new Date(start);
    if (period === 'week') end.setDate(end.getDate() + 7);
    else if (period === 'month') end.setMonth(end.getMonth() + 1);
    else end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function equivalentPeriodBounds(period) {
    const now = new Date();
    let start;
    let previousStart;
    if (period === 'week') {
      start = startOfWeek(now);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
    } else if (period === 'month') {
      start = startOfMonth(now);
      previousStart = new Date(start);
      previousStart.setMonth(previousStart.getMonth() - 1);
    } else {
      start = startOfDay(now);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
    }
    const currentEnd = new Date(startOfDay(now));
    currentEnd.setDate(currentEnd.getDate() + 1);
    const currentPeriodEnd = period === 'week' ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) : period === 'month' ? new Date(start.getFullYear(), start.getMonth() + 1, 1) : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const boundedCurrentEnd = currentEnd < currentPeriodEnd ? currentEnd : currentPeriodEnd;
    const elapsed = boundedCurrentEnd.getTime() - start.getTime();
    const previousPeriodEnd = period === 'week' ? new Date(previousStart.getFullYear(), previousStart.getMonth(), previousStart.getDate() + 7) : period === 'month' ? new Date(previousStart.getFullYear(), previousStart.getMonth() + 1, 1) : new Date(previousStart.getFullYear(), previousStart.getMonth(), previousStart.getDate() + 1);
    const previousEnd = new Date(Math.min(previousStart.getTime() + elapsed, previousPeriodEnd.getTime()));
    return { current: { start, end: boundedCurrentEnd }, previous: { start: previousStart, end: previousEnd } };
  }

  function inBounds(value, bounds) {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= bounds.start && date < bounds.end;
  }

  function countUniqueStageEntriesInBounds(stageId, bounds) {
    return state.prospects.filter((lead) => leadStageEvents(lead, stageId).some((event) => inBounds(event.at, bounds))).length;
  }

  function countActivitiesInBounds(bounds) {
    return state.prospects.reduce((sum, lead) => sum + lead.activities.filter((activity) => inBounds(activity.at, bounds)).length, 0);
  }

  function countConnectedActivitiesInBounds(bounds) {
    return state.prospects.reduce((sum, lead) => sum + lead.activities.filter((activity) => activity.connected && inBounds(activity.at, bounds)).length, 0);
  }

  function countWonInBounds(bounds) {
    return countUniqueStageEntriesInBounds('won', bounds);
  }

  function stageTransitionDuration(stageId, nextStageId) {
    const durations = [];
    state.prospects.forEach((lead) => {
      const events = lead.stageHistory.slice().sort((a, b) => new Date(a.at) - new Date(b.at));
      for (let index = 0; index < events.length - 1; index += 1) {
        if (events[index].stage !== stageId || events[index + 1].stage !== nextStageId) continue;
        const days = Math.max(0, (startOfDay(new Date(events[index + 1].at)) - startOfDay(new Date(events[index].at))) / 86400000);
        durations.push(days);
      }
    });
    return {
      count: durations.length,
      average: durations.length ? durations.reduce((sum, days) => sum + days, 0) / durations.length : null,
    };
  }

  function boundsLabel(bounds) {
    const last = new Date(bounds.end.getTime() - 86400000);
    return `${displayDate(bounds.start)}–${displayDate(last)}`;
  }

  function inPeriod(value, period) {
    const date = new Date(value);
    const { start, end } = periodBounds(period);
    return !Number.isNaN(date.getTime()) && date >= start && date < end;
  }

  function periodLabel(period) {
    if (period === 'week') {
      const { start, end } = periodBounds('week');
      const last = new Date(end.getTime() - 86400000);
      return `${displayDate(start)}–${displayDate(last)}`;
    }
    if (period === 'month') return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date());
    return 'hoy';
  }

  function activeProspects() {
    return state.prospects.filter((lead) => !['backlog', 'won', 'lost'].includes(lead.stage));
  }

  function leadStageEvents(lead, stageId) {
    return lead.stageHistory.filter((entry) => entry.stage === stageId);
  }

  function firstStageDate(lead, stageId) {
    const events = leadStageEvents(lead, stageId).sort((a, b) => new Date(a.at) - new Date(b.at));
    return events[0]?.at || null;
  }

  function latestStageEvent(lead) {
    const events = lead.stageHistory.slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    return events[0] || { stage: lead.stage, at: lead.stageChangedAt };
  }

  function ageInDays(value) {
    const date = new Date(value);
    return Math.max(0, Math.floor((startOfDay(new Date()) - startOfDay(date)) / 86400000));
  }

  function monthTargetInfo() {
    const [startYear, startMonth] = state.settings.monthOne.split('-').map(Number);
    const startIndex = startYear * 12 + (startMonth - 1);
    const now = new Date();
    const currentIndex = now.getFullYear() * 12 + now.getMonth();
    const sequence = currentIndex - startIndex + 1;
    const monthNumber = Math.max(1, sequence);
    const targetIndex = Math.min(4, monthNumber - 1);
    return {
      monthNumber,
      target: sequence <= 0 ? 0 : state.settings.monthlySellerTargets[targetIndex],
      active: sequence > 0,
    };
  }

  function countStageEntries(stageId, period) {
    return state.prospects.reduce((sum, lead) => sum + leadStageEvents(lead, stageId).filter((event) => inPeriod(event.at, period)).length, 0);
  }

  function distinctLeadsEntering(stageId, period) {
    return state.prospects.filter((lead) => leadStageEvents(lead, stageId).some((event) => inPeriod(event.at, period))).length;
  }

  function wonInPeriod(period) {
    return state.prospects.filter((lead) => leadStageEvents(lead, 'won').some((event) => inPeriod(event.at, period))).length;
  }

  function actionsInPeriod(period) {
    return state.prospects.flatMap((lead) => lead.activities.map((activity) => ({ ...activity, leadId: lead.id, industry: lead.industry, leadName: lead.name }))).filter((activity) => inPeriod(activity.at, period));
  }

  function monthlyMonthTargetLabel() {
    const { monthNumber } = monthTargetInfo();
    const now = new Date();
    return monthNumber > 0 ? `Mes ${monthNumber} · ${new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(now)}` : 'Meta mensual';
  }

  function navTo(view) {
    currentView = VIEW_LABELS[view] ? view : 'dashboard';
    document.querySelectorAll('.nav-link[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === currentView));
    document.getElementById('viewBreadcrumb').textContent = VIEW_LABELS[currentView];
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    const renderers = {
      dashboard: renderDashboard,
      kanban: renderKanban,
      prospects: renderProspects,
      campaigns: renderCampaigns,
      insights: renderInsights,
      settings: renderSettings,
    };
    appView.innerHTML = renderers[currentView]();
  }

  function renderPeriodSwitch() {
    return `<div class="period-switch" role="tablist" aria-label="Periodo de lectura">
      <button type="button" role="tab" aria-selected="${selectedPeriod === 'day'}" class="${selectedPeriod === 'day' ? 'is-active' : ''}" data-period="day">Hoy</button>
      <button type="button" role="tab" aria-selected="${selectedPeriod === 'week'}" class="${selectedPeriod === 'week' ? 'is-active' : ''}" data-period="week">Semana</button>
      <button type="button" role="tab" aria-selected="${selectedPeriod === 'month'}" class="${selectedPeriod === 'month' ? 'is-active' : ''}" data-period="month">Mes</button>
    </div>`;
  }

  function renderDashboard() {
    const todayQualified = distinctLeadsEntering('qualification', 'day');
    const dayTarget = state.settings.dailyQualificationTarget;
    const weekday = new Date().getDay();
    const dayGoalActive = weekday >= 1 && weekday <= 5;
    const dayPct = dayGoalActive && dayTarget ? Math.min(100, (todayQualified / dayTarget) * 100) : 0;
    const dayColor = dayPct >= 75 ? '#15966d' : dayPct >= 40 ? '#c98111' : '#d94c55';
    const stageRows = [
      { id: 'qualification', label: 'Calificación', symbol: '◎' },
      { id: 'negotiation', label: 'Negociación', symbol: '↗' },
      { id: 'closing', label: 'Closing Deal', symbol: '✦' },
    ];
    const weeklyStages = stageRows.map((stage) => {
      const count = distinctLeadsEntering(stage.id, 'week');
      const goal = state.settings.weeklyTargets[stage.id];
      const pct = goal ? Math.min(100, (count / goal) * 100) : 0;
      const fillClass = count >= goal && goal > 0 ? 'good' : count >= goal * .65 ? 'warn' : '';
      return `<div class="stage-target">
        <div class="stage-target-top"><span>${stage.symbol} ${stage.label}</span><span class="tag">esta semana</span></div>
        <div class="stage-target-value">${num(count)} <small>/ ${num(goal)}</small></div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
    const monthTarget = monthTargetInfo();
    const monthWon = wonInPeriod('month');
    const monthPct = monthTarget.target ? Math.min(100, (monthWon / monthTarget.target) * 100) : 0;
    const monthRemaining = Math.max(0, monthTarget.target - monthWon);
    const periodActions = actionsInPeriod(selectedPeriod);
    const connections = periodActions.filter((activity) => activity.connected).length;
    const periodQualified = distinctLeadsEntering('qualification', selectedPeriod);
    const backlogCount = state.prospects.filter((lead) => lead.stage === 'backlog').length;
    const activeCount = activeProspects().length;
    const channelRows = CHANNELS.map((channel) => {
      const items = periodActions.filter((activity) => activity.channel === channel.id);
      const connected = items.filter((activity) => activity.connected).length;
      return `<div class="channel-row">
        <div class="channel-name"><span class="channel-symbol">${channel.symbol}</span>${channel.label}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${items.length ? Math.max(4, (items.length / Math.max(1, periodActions.length)) * 100) : 0}%"></div></div>
        <div class="channel-count">${num(items.length)}</div>
        <div class="channel-rate">${items.length ? `${num(connected)} conectó` : '—'}</div>
      </div>`;
    }).join('');
    const industryPanel = renderIndustryDonut();
    const dateCaption = periodLabel(selectedPeriod);
    const currentQualificationFlow = countStageEntries('qualification', 'week');

    return `<section class="view-header">
      <div><p class="view-kicker">ENFOQUE COMERCIAL</p><h1>Tu ritmo, sin ruido.</h1><p class="view-description">Avanza lo que sí trabajas. La lista importada espera en “Por trabajar” y no infla tus metas.</p></div>
      ${renderPeriodSwitch()}
    </section>
    <section class="kpi-grid" aria-label="Resumen del periodo">
      <article class="metric-card"><div class="metric-label"><span>Por trabajar</span><span class="metric-icon">◎</span></div><div class="metric-value">${num(backlogCount)}</div><div class="metric-sub">No cuenta como Calificación</div></article>
      <article class="metric-card"><div class="metric-label"><span>Entraron a Calificación · ${escapeHtml(dateCaption)}</span><span class="metric-icon">↗</span></div><div class="metric-value">${num(periodQualified)}</div><div class="metric-sub">${selectedPeriod === 'day' ? `Meta: ${num(dayTarget)} · lunes a viernes` : 'Negocios únicos en el periodo'}</div></article>
      <article class="metric-card"><div class="metric-label"><span>Toques directos · ${escapeHtml(dateCaption)}</span><span class="metric-icon">⌁</span></div><div class="metric-value">${num(periodActions.length)}</div><div class="metric-sub">Correo YAMM no se suma aquí</div></article>
      <article class="metric-card"><div class="metric-label"><span>Conexiones · ${escapeHtml(dateCaption)}</span><span class="metric-icon">✓</span></div><div class="metric-value">${num(connections)}</div><div class="metric-sub">${periodActions.length ? `${percentage(connections, periodActions.length)} de los toques registrados` : 'Aún sin actividad registrada'}</div></article>
    </section>
    <section class="dashboard-grid">
      <div class="left-stack">
        <article class="panel speed-panel">
          <div class="panel-heading"><div><h2>Meta de actividad diaria</h2><p>Negocios que activas en Calificación</p></div><span class="tag">Hoy</span></div>
          <div class="gauge-wrap" aria-label="${num(todayQualified)} de ${dayGoalActive ? num(dayTarget) : 'sin meta diaria'} negocios nuevos en Calificación hoy">
            <svg class="gauge-svg" viewBox="0 0 280 160" aria-hidden="true">
              <path class="gauge-track" d="M 25 140 A 115 115 0 0 1 255 140" pathLength="100"></path>
              <path class="gauge-segment" d="M 25 140 A 115 115 0 0 1 255 140" pathLength="100" stroke="#d94c55" stroke-dasharray="32 100" stroke-dashoffset="0"></path>
              <path class="gauge-segment" d="M 25 140 A 115 115 0 0 1 255 140" pathLength="100" stroke="#e7a322" stroke-dasharray="36 100" stroke-dashoffset="-32"></path>
              <path class="gauge-segment" d="M 25 140 A 115 115 0 0 1 255 140" pathLength="100" stroke="#15966d" stroke-dasharray="32 100" stroke-dashoffset="-68"></path>
              <path class="gauge-progress" d="M 25 140 A 115 115 0 0 1 255 140" pathLength="100" style="stroke:${dayColor};stroke-dasharray:${dayPct} 100;stroke-dashoffset:0;opacity:${dayPct > 0 ? 1 : 0}"></path>
            </svg>
            <div class="gauge-number">${num(todayQualified)} <span>/ ${dayGoalActive ? num(dayTarget) : '—'}</span></div>
            <div class="gauge-caption">NEGOCIOS EN CALIFICACIÓN</div>
          </div>
          <div class="gauge-range"><span>0</span><span>${dayGoalActive ? num(Math.round(dayTarget / 2)) : 'fin de semana'}</span><span>${dayGoalActive ? `${num(dayTarget)}+` : 'sin meta'}</span></div>
          <p class="goal-status ${dayGoalActive && dayPct >= 100 ? 'good' : dayGoalActive && dayPct >= 75 ? 'warn' : ''}">${dayGoalActive ? (dayPct >= 100 ? 'Meta diaria alcanzada' : `Te faltan ${num(dayTarget - todayQualified)} para la meta`) : 'Fin de semana: la meta diaria aplica de lunes a viernes'}</p>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Resultado del mes</h2><p>${escapeHtml(monthlyMonthTargetLabel())} · cierre ganado registrado</p></div><span class="tag">${monthTarget.active ? `${num(monthWon)} / ${num(monthTarget.target)}` : 'Ajusta el mes de inicio'}</span></div>
          ${monthTarget.active ? `<div class="metric-value">${num(monthWon)} <span class="muted small">/ ${num(monthTarget.target)} sellers</span></div><div class="progress-track" style="margin:12px 0 7px;height:7px"><div class="progress-fill ${monthPct >= 100 ? 'good' : ''}" style="width:${monthPct}%"></div></div><p class="metric-sub">${monthRemaining ? `Faltan ${num(monthRemaining)} cierres para la meta` : 'Meta mensual alcanzada'}. El TPV real y la calidad viven en el CRM de la empresa.</p>` : `<div class="inline-note">La fecha actual está antes del mes de inicio configurado. Ajusta el inicio en <button class="link-button" data-view-link="settings">Ajustes</button>.</div>`}
        </article>
      </div>
      <div class="right-stack">
        <article class="panel">
          <div class="panel-heading"><div><h2>Avance de metas semanales</h2><p>Negocios únicos que entraron a cada etapa esta semana; la cartera activa está en Pipeline.</p></div><span class="tag">${num(activeCount)} activos</span></div>
          <div class="stage-targets">${weeklyStages}</div>
          <div class="inline-note" style="margin-top:12px"><strong>Movimiento esta semana:</strong> ${num(currentQualificationFlow)} negocio(s) entraron a Calificación. La meta diaria de ${num(dayTarget)} se cuenta al activar un prospecto del backlog, no al importar la lista.</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Toques directos por canal</h2><p>${escapeHtml(dateCaption)} · solo acciones negocio por negocio</p></div><button class="text-button" data-view-link="insights">Ver lecturas</button></div>
          <div class="channel-list">${channelRows}</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Industria del pipeline activo</h2><p>Negocios en Calificación, Negociación y Closing Deal</p></div><span class="tag">${num(activeCount)} negocios</span></div>
          ${industryPanel}
        </article>
      </div>
    </section>`;
  }

  function renderIndustryDonut() {
    const items = activeProspects();
    const counts = new Map();
    items.forEach((lead) => counts.set(lead.industry || 'Sin industria', (counts.get(lead.industry || 'Sin industria') || 0) + 1));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return `<div class="empty-state"><strong>Tu mapa de industrias aparecerá aquí</strong>Activa prospectos del backlog para empezar a comparar.</div>`;
    const shown = sorted.slice(0, 8);
    const otherCount = sorted.slice(8).reduce((sum, [, count]) => sum + count, 0);
    const total = shown.reduce((sum, [, count]) => sum + count, 0) + otherCount;
    let offset = 0;
    const stops = shown.map(([, count], index) => {
      const start = offset;
      offset += (count / total) * 100;
      return `${INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} ${start.toFixed(2)}% ${offset.toFixed(2)}%`;
    });
    if (otherCount) stops.push(`#dfe7ef ${offset.toFixed(2)}% 100%`);
    const legend = shown.map(([industry, count], index) => `<div class="legend-row"><span class="legend-dot" style="background:${INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]}"></span><span>${escapeHtml(industry)}</span><b>${num(count)}</b></div>`).join('');
    const other = otherCount ? `<div class="legend-row"><span class="legend-dot" style="background:#dfe7ef"></span><span>Otras industrias</span><b>${num(otherCount)}</b></div>` : '';
    return `<div class="industry-layout"><div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops.join(', ')})"><div class="donut-center">${num(items.length)}<small>negocios</small></div></div></div><div class="legend-list">${legend}${other}</div></div>`;
  }

  function renderKanban() {
    const activeColumns = STAGES.filter((stage) => stage.id !== 'backlog');
    const targetMap = state.settings.weeklyTargets;
    const columns = activeColumns.map((stage) => {
      const deals = state.prospects.filter((lead) => lead.stage === stage.id).sort((a, b) => new Date(a.stageChangedAt) - new Date(b.stageChangedAt));
      const goal = targetMap[stage.id];
      const goalLabel = ['qualification', 'negotiation', 'closing'].includes(stage.id) ? `Meta semanal ${num(goal)} · ${num(distinctLeadsEntering(stage.id, 'week'))} entraron esta semana` : stage.id === 'won' ? `${num(wonInPeriod('month'))} ganados este mes` : 'Cierres sin ganar';
      return `<section class="board-column" data-drop-stage="${stage.id}" aria-label="${escapeHtml(stage.label)}">
        <div class="board-column-head"><span class="board-column-title">${escapeHtml(stage.label)}</span><span class="board-column-count">${num(deals.length)}</span></div>
        <div class="board-column-goal">${goalLabel}</div>
        <div class="board-cards">${deals.length ? deals.map(renderDealCard).join('') : `<div class="no-results">Sin negocios en esta etapa</div>`}</div>
      </section>`;
    }).join('');
    const backlogCount = state.prospects.filter((lead) => lead.stage === 'backlog').length;
    return `<section class="view-header"><div><p class="view-kicker">KANBAN</p><h1>Pipeline en movimiento.</h1><p class="view-description">Para cambiar de etapa, registra un toque real. El movimiento no se guarda si cancelas el registro.</p></div><button class="button button-quiet" data-view-link="prospects">Ver “Por trabajar” · ${num(backlogCount)}</button></section>
      <div class="inline-note" style="margin-bottom:13px"><strong>Alerta de tiempo:</strong> los días en etapa se calculan desde el último cambio. Más de 7 días se resalta para revisión; no cambia la etapa automáticamente.</div>
      <div class="pipeline-board">${columns}</div>`;
  }

  function renderDealCard(lead) {
    const age = ageInDays(lead.stageChangedAt);
    const counts = CHANNELS.map((channel) => ({ channel, count: lead.activities.filter((activity) => activity.channel === channel.id).length })).filter((item) => item.count > 0);
    const touchSummary = counts.length ? `<div class="deal-touch-summary">${counts.map((item) => `<span class="touch-chip">${item.channel.symbol} ${item.count}</span>`).join('')}</div>` : '';
    const badge = age > 7 ? `<span class="alert-pill">Revisar</span>` : '';
    return `<article class="deal-card" draggable="true" data-lead-id="${escapeHtml(lead.id)}">
      <div class="deal-title"><span>${escapeHtml(lead.name)}</span>${badge}</div>
      <div class="deal-industry">${escapeHtml(lead.industry || 'Sin industria')}</div>
      <div class="deal-age ${age > 7 ? 'alert' : ''}"><span aria-hidden="true">◷</span> ${num(age)} ${age === 1 ? 'día' : 'días'} en etapa ${age > 7 ? '· > 7 días' : ''}</div>
      ${touchSummary}
      <div class="deal-actions"><button type="button" data-action="activity" data-id="${escapeHtml(lead.id)}">＋ Toque</button><button class="secondary-action" type="button" data-action="move" data-id="${escapeHtml(lead.id)}">Cambiar etapa</button></div>
    </article>`;
  }

  function renderProspects() {
    const all = state.prospects.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = all.filter((lead) => {
      const q = prospectFilter.q.toLocaleLowerCase('es-MX');
      const matchesText = !q || `${lead.name} ${lead.industry}`.toLocaleLowerCase('es-MX').includes(q);
      return matchesText && (prospectFilter.stage === 'all' || lead.stage === prospectFilter.stage);
    });
    const pageSize = 50;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    prospectFilter.page = Math.max(1, Math.min(prospectFilter.page, totalPages));
    const pageLeads = filtered.slice((prospectFilter.page - 1) * pageSize, prospectFilter.page * pageSize);
    const rows = pageLeads.map((lead) => {
      const counts = CHANNELS.map((channel) => `${channel.symbol} ${lead.activities.filter((activity) => activity.channel === channel.id).length}`).join(' · ');
      const age = ageInDays(lead.stageChangedAt);
      const actions = lead.stage === 'backlog' ? `<button class="table-action" data-action="move" data-id="${escapeHtml(lead.id)}">Activar + registrar toque</button>` : `<button class="table-action" data-action="activity" data-id="${escapeHtml(lead.id)}">Registrar toque</button>`;
      return `<tr><td class="business-cell">${escapeHtml(lead.name)}</td><td>${escapeHtml(lead.industry)}</td><td><span class="stage-badge ${lead.stage}">${escapeHtml(stageLabel(lead.stage))}</span></td><td>${escapeHtml(counts)}</td><td>${num(age)} d${age > 7 && !['won', 'lost', 'backlog'].includes(lead.stage) ? ' <span class="alert-pill">Revisar</span>' : ''}</td><td><button class="table-action" data-action="edit-lead" data-id="${escapeHtml(lead.id)}">Editar</button> ${actions}</td></tr>`;
    }).join('');
    const backlogCount = state.prospects.filter((lead) => lead.stage === 'backlog').length;
    return `<section class="view-header"><div><p class="view-kicker">DIRECTORIO SIMPLE</p><h1>Prospectos.</h1><p class="view-description">Nombre, industria, etapa y conteo de toques. No guardamos datos de contacto ni notas libres.</p></div><div class="toolbar-right"><button class="button button-quiet" data-action="import-csv">Importar lista CSV</button><button class="button button-primary" data-action="add-lead">＋ Nuevo prospecto</button></div></section>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><article class="metric-card"><div class="metric-label"><span>Por trabajar</span><span class="metric-icon">◎</span></div><div class="metric-value">${num(backlogCount)}</div><div class="metric-sub">Importar no cuenta como avance</div></article><article class="metric-card"><div class="metric-label"><span>En pipeline activo</span><span class="metric-icon">▦</span></div><div class="metric-value">${num(activeProspects().length)}</div><div class="metric-sub">Calificación · Negociación · Closing Deal</div></article><article class="metric-card"><div class="metric-label"><span>Lista cargada</span><span class="metric-icon">↥</span></div><div class="metric-value">${num(state.prospects.length)}</div><div class="metric-sub">Solo nombre e industria del CSV</div></article></div>
      <section class="panel"><div class="toolbar"><div class="toolbar-left"><input class="field filter-field" id="prospectSearch" type="search" placeholder="Buscar negocio o industria" value="${escapeHtml(prospectFilter.q)}" aria-label="Buscar por negocio o industria"><select class="select-field filter-select" id="stageFilter" aria-label="Filtrar por etapa"><option value="all" ${prospectFilter.stage === 'all' ? 'selected' : ''}>Todas las etapas</option>${STAGES.map((stage) => `<option value="${stage.id}" ${prospectFilter.stage === stage.id ? 'selected' : ''}>${escapeHtml(stage.label)}</option>`).join('')}</select></div><div class="toolbar-right"><span class="tag">${num(filtered.length)} resultados · ${prospectFilter.page}/${totalPages}</span><button class="button button-quiet button-small" data-action="prospect-page" data-delta="-1" ${prospectFilter.page <= 1 ? 'disabled' : ''}>Anterior</button><button class="button button-quiet button-small" data-action="prospect-page" data-delta="1" ${prospectFilter.page >= totalPages ? 'disabled' : ''}>Siguiente</button></div></div>
      <p class="search-summary">Los correos de YAMM se registran en <button class="link-button" data-view-link="campaigns">Campañas YAMM</button>; nunca suman en los toques directos por negocio.</p>
      ${filtered.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Negocio</th><th>Industria</th><th>Etapa</th><th>Toques directos</th><th>Días</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><strong>${all.length ? 'No hay coincidencias' : 'Tu lista empieza aquí'}</strong>${all.length ? 'Prueba otra búsqueda o etapa.' : 'Importa tu CSV. Solo se tomarán nombre del negocio e industria; los correos y demás columnas se descartan.'}${all.length ? '' : '<br><button class="button button-primary" data-action="import-csv">Importar lista CSV</button>'}</div>`}</section>`;
  }

  function renderCampaigns() {
    const { start, end } = periodBounds(selectedPeriod);
    const rows = state.campaigns.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const periodRows = rows.filter((campaign) => new Date(campaign.date) >= start && new Date(campaign.date) < end);
    const sent = periodRows.reduce((sum, campaign) => sum + campaign.sent, 0);
    const replies = periodRows.reduce((sum, campaign) => sum + campaign.replies, 0);
    const tableRows = rows.map((campaign) => `<tr><td class="business-cell">${escapeHtml(campaign.label)}</td><td>${escapeHtml(campaign.industry)}</td><td>${displayDate(campaign.date, { year: 'numeric', month: 'short', day: 'numeric' })}</td><td>${num(campaign.sent)}</td><td>${num(campaign.replies)}</td><td>${percentage(campaign.replies, campaign.sent)}</td><td><button class="table-action" data-action="delete-campaign" data-id="${escapeHtml(campaign.id)}">Eliminar</button></td></tr>`).join('');
    const segmentTotals = new Map();
    periodRows.forEach((campaign) => {
      const segment = campaign.industry || 'Sin segmento';
      const total = segmentTotals.get(segment) || { sent: 0, replies: 0, campaigns: 0 };
      total.sent += campaign.sent;
      total.replies += campaign.replies;
      total.campaigns += 1;
      segmentTotals.set(segment, total);
    });
    const segmentRows = [...segmentTotals.entries()].sort((a, b) => b[1].sent - a[1].sent).map(([segment, total]) => `<tr><td class="business-cell">${escapeHtml(segment)}</td><td>${num(total.campaigns)}</td><td>${num(total.sent)}</td><td>${num(total.replies)}</td><td>${percentage(total.replies, total.sent)}</td></tr>`).join('');
    return `<section class="view-header"><div><p class="view-kicker">CARRIL SEPARADO</p><h1>Campañas YAMM.</h1><p class="view-description">Registra solo agregados de campaña. No importes listas, direcciones de correo ni respuestas individuales.</p></div><button class="button button-primary" data-action="add-campaign">＋ Registrar campaña</button></section>
      <div class="period-switch" role="tablist" aria-label="Periodo para campañas">${[['day','Hoy'],['week','Semana'],['month','Mes']].map(([period,label]) => `<button role="tab" aria-selected="${selectedPeriod === period}" class="${selectedPeriod === period ? 'is-active' : ''}" data-period="${period}">${label}</button>`).join('')}</div>
      <section class="campaign-grid" style="margin-top:13px"><article class="campaign-card"><div class="metric-label"><span>Enviados · ${escapeHtml(periodLabel(selectedPeriod))}</span><span class="metric-icon">✉</span></div><div class="metric-value">${num(sent)}</div><div class="metric-sub">Conteo manual desde el reporte de campaña</div></article><article class="campaign-card"><div class="metric-label"><span>Respuestas · ${escapeHtml(periodLabel(selectedPeriod))}</span><span class="metric-icon">↩</span></div><div class="metric-value">${num(replies)}</div><div class="metric-sub">No se cuentan como correo directo individual</div></article><article class="campaign-card"><div class="metric-label"><span>Tasa de respuesta · ${escapeHtml(periodLabel(selectedPeriod))}</span><span class="metric-icon">%</span></div><div class="metric-value">${percentage(replies, sent)}</div><div class="metric-sub">Respuestas ÷ enviados registrados</div></article></section>
      <section class="panel" style="margin-bottom:14px"><div class="panel-heading"><div><h2>Respuesta por segmento</h2><p>${escapeHtml(periodLabel(selectedPeriod))} · solo campañas agregadas</p></div></div>${segmentRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Industria / segmento</th><th>Campañas</th><th>Enviados</th><th>Respuestas</th><th>Respuesta</th></tr></thead><tbody>${segmentRows}</tbody></table></div>` : `<div class="empty-state">Aún no hay campañas en este periodo.</div>`}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Historial de campañas</h2><p>Etiqueta, segmento y totales; no se copia la lista ni los destinatarios.</p></div><span class="tag">${num(rows.length)} campañas</span></div>
      ${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Campaña</th><th>Segmento</th><th>Fecha</th><th>Enviados</th><th>Respuestas</th><th>Respuesta</th><th></th></tr></thead><tbody>${tableRows}</tbody></table></div>` : `<div class="empty-state"><strong>Aún no registras campañas</strong>Cuando lances una campaña, anota su identificador y los totales del reporte YAMM. Esta actividad se mantiene fuera del pipeline individual.<br><button class="button button-quiet" data-action="add-campaign">Registrar la primera campaña</button></div>`}
      <p class="campaign-table-note">No contamos aperturas como conexión. Una campaña de mailing nunca incrementa los toques de “Correo directo”.</p></section>`;
  }

  function renderInsights() {
    const actions = actionsInPeriod(selectedPeriod);
    const comparison = equivalentPeriodBounds(selectedPeriod);
    const comparisonMetrics = [
      { label: 'Toques directos', current: countActivitiesInBounds(comparison.current), previous: countActivitiesInBounds(comparison.previous) },
      { label: 'Toques con conexión', current: countConnectedActivitiesInBounds(comparison.current), previous: countConnectedActivitiesInBounds(comparison.previous) },
      { label: 'Entraron a Calificación', current: countUniqueStageEntriesInBounds('qualification', comparison.current), previous: countUniqueStageEntriesInBounds('qualification', comparison.previous) },
      { label: 'Entraron a Negociación', current: countUniqueStageEntriesInBounds('negotiation', comparison.current), previous: countUniqueStageEntriesInBounds('negotiation', comparison.previous) },
      { label: 'Entraron a Closing Deal', current: countUniqueStageEntriesInBounds('closing', comparison.current), previous: countUniqueStageEntriesInBounds('closing', comparison.previous) },
      { label: 'Cierres ganados', current: countWonInBounds(comparison.current), previous: countWonInBounds(comparison.previous) },
    ];
    const comparisonRows = comparisonMetrics.map((metric) => {
      const delta = metric.current - metric.previous;
      const deltaLabel = delta > 0 ? `+${num(delta)}` : num(delta);
      return `<tr><td class="business-cell">${escapeHtml(metric.label)}</td><td>${num(metric.current)}</td><td>${num(metric.previous)}</td><td class="${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : ''}">${deltaLabel}</td></tr>`;
    }).join('');
    const channelRows = CHANNELS.map((channel) => {
      const items = actions.filter((action) => action.channel === channel.id);
      const connected = items.filter((action) => action.connected).length;
      const businesses = new Set(items.map((action) => action.leadId)).size;
      const connectedBusinesses = new Set(items.filter((action) => action.connected).map((action) => action.leadId)).size;
      return `<tr><td class="business-cell">${channel.symbol} ${channel.label}</td><td>${num(items.length)}</td><td>${num(businesses)}</td><td>${num(connectedBusinesses)}</td><td>${percentage(connected, items.length)}</td></tr>`;
    }).join('');
    const periodCohort = state.prospects.filter((lead) => leadStageEvents(lead, 'qualification').some((event) => inPeriod(event.at, selectedPeriod)));
    const industries = [...new Set(periodCohort.map((lead) => lead.industry || 'Sin industria'))].sort((a,b) => a.localeCompare(b, 'es-MX'));
    const industryRows = industries.map((industry) => {
      const leads = periodCohort.filter((lead) => lead.industry === industry);
      const won = leads.filter((lead) => {
        const cohortEntry = leadStageEvents(lead, 'qualification').find((event) => inPeriod(event.at, selectedPeriod));
        return cohortEntry && leadStageEvents(lead, 'won').some((event) => new Date(event.at) >= new Date(cohortEntry.at));
      }).length;
      return `<tr><td class="business-cell">${escapeHtml(industry)}</td><td>${num(leads.length)}</td><td>${num(won)} / ${num(leads.length)}</td><td>${percentage(won, leads.length)}</td></tr>`;
    }).join('');
    const maxTouches = Math.max(1, ...CHANNELS.map((channel) => actions.filter((action) => action.channel === channel.id).length));
    const bars = CHANNELS.map((channel) => {
      const count = actions.filter((action) => action.channel === channel.id).length;
      return `<div class="bar-row"><div class="bar-label">${channel.symbol} ${channel.label}</div><div class="bar-track"><div class="bar-fill" style="width:${count ? Math.max(3, (count / maxTouches) * 100) : 0}%"></div></div><div class="bar-value">${num(count)}</div></div>`;
    }).join('');
    const nextStage = { qualification: 'negotiation', negotiation: 'closing', closing: 'won' };
    const stageEntryRows = STAGES.filter((stage) => stage.id !== 'backlog').map((stage) => {
      const entrants = state.prospects.filter((lead) => leadStageEvents(lead, stage.id).some((event) => inPeriod(event.at, selectedPeriod)));
      const next = nextStage[stage.id];
      const advanced = next ? entrants.filter((lead) => {
        const cohortEntry = leadStageEvents(lead, stage.id).find((event) => inPeriod(event.at, selectedPeriod));
        return cohortEntry && leadStageEvents(lead, next).some((event) => new Date(event.at) >= new Date(cohortEntry.at));
      }).length : null;
      return `<tr><td class="business-cell">${escapeHtml(stage.label)}</td><td>${num(entrants.length)}</td><td>${next ? `${num(advanced)} / ${num(entrants.length)}` : '—'}</td><td>${next ? percentage(advanced, entrants.length) : '—'}</td></tr>`;
    }).join('');
    const durationSteps = [
      { from: 'qualification', to: 'negotiation', label: 'Calificación → Negociación' },
      { from: 'negotiation', to: 'closing', label: 'Negociación → Closing Deal' },
      { from: 'closing', to: 'won', label: 'Closing Deal → Ganado' },
    ];
    const durationRows = durationSteps.map((step) => {
      const result = stageTransitionDuration(step.from, step.to);
      const avg = result.average === null ? '—' : new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(result.average);
      return `<tr><td class="business-cell">${escapeHtml(step.label)}</td><td>${avg}${result.average === null ? '' : ' días'}</td><td>${num(result.count)}</td></tr>`;
    }).join('');
    return `<section class="view-header"><div><p class="view-kicker">APRENDER SIN SOBREANALIZAR</p><h1>Lecturas simples.</h1><p class="view-description">Compara solo lo que registras. Mira el tamaño de muestra antes de decidir qué canal o industria probar.</p></div>${renderPeriodSwitch()}</section>
      <div class="insight-grid">
        <section class="panel" style="grid-column:1/-1"><div class="panel-heading"><div><h2>Comparación contra periodo anterior</h2><p>Mismo número de días transcurridos, para no comparar una semana o mes incompleto contra uno completo.</p></div><span class="tag">${escapeHtml(periodLabel(selectedPeriod))}</span></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Métrica</th><th>Actual · ${escapeHtml(boundsLabel(comparison.current))}</th><th>Anterior · ${escapeHtml(boundsLabel(comparison.previous))}</th><th>Diferencia</th></tr></thead><tbody>${comparisonRows}</tbody></table></div><p class="insight-footnote">En el día compara hoy con ayer; en semana/mes compara el tramo transcurrido con los mismos días del periodo anterior.</p></section>
        <section class="panel"><div class="panel-heading"><div><h2>Conexión por canal</h2><p>${escapeHtml(periodLabel(selectedPeriod))} · toque individual, no mailing</p></div></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Canal</th><th>Toques</th><th>Negocios</th><th>Negocios conectados</th><th>Respuesta / toque</th></tr></thead><tbody>${channelRows}</tbody></table></div>
          <p class="insight-footnote">Respuesta por toque = toques marcados “Conectó” ÷ intentos. “Negocios conectados” cuenta cada negocio una sola vez. Mira ambos junto con el tamaño de muestra.</p></section>
        <section class="panel"><div class="panel-heading"><div><h2>Volumen de ejecución</h2><p>Toques directos por canal · ${escapeHtml(periodLabel(selectedPeriod))}</p></div></div><div class="bar-list">${bars}</div><p class="insight-footnote">Las respuestas agregadas de campañas YAMM aparecen únicamente en su vista separada.</p></section>
        <section class="panel" style="grid-column:1/-1"><div class="panel-heading"><div><h2>Conversión entre etapas</h2><p>${escapeHtml(periodLabel(selectedPeriod))} · negocios únicos de la cohorte que avanzaron después</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Etapa de entrada</th><th>Entraron</th><th>Llegaron a la siguiente</th><th>Conversión</th></tr></thead><tbody>${stageEntryRows}</tbody></table></div><p class="insight-footnote">Las cohortes del día o semana actual siguen madurando: una conversión baja no significa que ya se hayan perdido.</p></section>
        <section class="panel" style="grid-column:1/-1"><div class="panel-heading"><div><h2>Tiempo promedio para avanzar</h2><p>Histórico acumulado · días calendario · solo transiciones completadas</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Tramo</th><th>Promedio</th><th>Casos</th></tr></thead><tbody>${durationRows}</tbody></table></div><p class="insight-footnote">Los negocios abiertos muestran sus días actuales en Pipeline; se marca “Revisar” al superar 7 días en una etapa.</p></section>
        <section class="panel" style="grid-column:1/-1"><div class="panel-heading"><div><h2>Industria y avance</h2><p>Negocios que entraron a Calificación en este periodo y llegaron a Ganado después.</p></div><span class="tag">Cohorte de ${escapeHtml(periodLabel(selectedPeriod))}</span></div>
          ${industryRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Industria</th><th>En Calificación</th><th>Ganados / cohorte</th><th>Avance</th></tr></thead><tbody>${industryRows}</tbody></table></div>` : `<div class="empty-state"><strong>Aún no hay una cohorte en el periodo</strong>Al activar prospectos de distintas industrias podrás comparar.</div>`}
          <p class="insight-footnote">Solo comparamos giro y avance; el TPV real y la calidad permanecen en el CRM oficial. Las cohortes recientes siguen madurando.</p></section>
      </div>`;
  }

  function renderSettings() {
    const goals = state.settings.weeklyTargets;
    return `<section class="view-header"><div><p class="view-kicker">CONFIGURACIÓN</p><h1>Tu tablero, ajustable.</h1><p class="view-description">Ajusta metas personales cuando cambien. No configuramos objetivos para llamadas o correos.</p></div><span class="tag">Sin conexión externa</span></section>
      <div class="settings-grid">
        <section class="panel"><div class="panel-heading"><div><h2>Metas de actividad</h2><p>Valores de referencia que muestran los medidores.</p></div></div>
          <form class="settings-form" id="goalsForm">
            <div class="form-group"><label for="dailyTarget">Negocios nuevos en Calificación por día</label><input class="field" id="dailyTarget" name="dailyTarget" type="number" min="1" max="500" value="${num(state.settings.dailyQualificationTarget)}" required><span class="form-hint">Por defecto, 8 de lunes a viernes. Solo cuenta al activar un prospecto y registrar el primer toque.</span></div>
            <div class="form-group"><label>Meta semanal de negocios que entran por etapa</label><div class="settings-goals"><div class="form-group"><label for="goalQualification">Calificación</label><input class="field" id="goalQualification" name="goalQualification" type="number" min="0" value="${num(goals.qualification)}"></div><div class="form-group"><label for="goalNegotiation">Negociación</label><input class="field" id="goalNegotiation" name="goalNegotiation" type="number" min="0" value="${num(goals.negotiation)}"></div><div class="form-group"><label for="goalClosing">Closing Deal</label><input class="field" id="goalClosing" name="goalClosing" type="number" min="0" value="${num(goals.closing)}"></div></div><span class="form-hint">Cuenta negocios únicos que entraron a cada etapa durante la semana, no el inventario que sigue activo.</span></div>
            <div class="form-group"><label for="monthOne">Mes 1 de tu curva de sellers</label><input class="field" id="monthOne" name="monthOne" type="month" value="${escapeHtml(state.settings.monthOne)}"><span class="form-hint">Define desde qué mes empieza la curva mensual.</span></div>
            <div class="form-group"><label>Meta mensual de cierres ganados</label><div class="settings-goals" style="grid-template-columns:repeat(5,minmax(0,1fr))">${state.settings.monthlySellerTargets.map((target, index) => `<div class="form-group"><label for="monthlyTarget${index + 1}">Mes ${index + 1}</label><input class="field" id="monthlyTarget${index + 1}" name="monthlyTarget${index + 1}" type="number" min="0" max="1000" value="${num(target)}"></div>`).join('')}</div><span class="form-hint">Desde el mes 5 se mantiene el último objetivo configurado.</span></div>
            <button class="button button-primary" type="submit">Guardar metas</button>
          </form>
        </section>
        <section class="panel"><div class="panel-heading"><div><h2>Privacidad y respaldo</h2><p>Alcance real de esta versión.</p></div></div>
          <div class="privacy-card"><div><strong>Se guarda en este navegador</strong><br>Nombre/alias del negocio, industria, etapa, fechas y conteos de toques directos por canal.</div><div><strong>No se guarda</strong><br>Teléfono, correo, contacto personal, contenido de mensajes, notas libres, TPV, puntos de calidad ni listas de mailing.</div><div><strong>CSV</strong><br>El archivo se procesa dentro del navegador. Solo se conservan nombre del negocio e industria; las demás columnas, incluidos correos, se descartan.</div><div><strong>YAMM</strong><br>Solo se guardan etiqueta, segmento, fecha, enviados y respuestas totales; nunca destinatarios.</div><div><strong>Sin llamadas a servicios externos</strong><br>Este tablero no usa Supabase, analítica, API ni sincronización. Para usarlo en infraestructura de la empresa, colócalo detrás del acceso interno aprobado.</div></div>
          <div class="toolbar" style="margin-top:15px;margin-bottom:0"><button class="button button-quiet" id="settingsImportJson" type="button">Restaurar respaldo JSON</button><button class="button button-quiet" id="settingsExportJson" type="button">Descargar respaldo</button></div>
          <div style="margin-top:18px;padding-top:15px;border-top:1px solid var(--line)"><h3 style="font-size:12px;color:var(--navy);margin-bottom:6px">Borrar los datos de este navegador</h3><p class="form-hint" style="margin-bottom:10px">Esta acción no se puede deshacer. Descarga un respaldo antes si lo necesitas.</p><button class="button button-danger button-small" id="clearDataButton" type="button">Borrar datos locales</button></div>
        </section>
      </div>`;
  }

  function dialogFrame(title, description, body, actions = '') {
    return `<div class="dialog-head"><div><h2 id="dialogTitle">${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><button class="dialog-close" type="button" data-close aria-label="Cerrar">×</button></div><div class="dialog-body">${body}</div>${actions ? `<div class="dialog-actions">${actions}</div>` : ''}`;
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
    dialog.innerHTML = '';
  }

  function openDialog(markup) {
    dialog.innerHTML = markup;
    if (!dialog.open) dialog.showModal();
    const first = dialog.querySelector('input:not([type="hidden"]), select, button:not([data-close])');
    if (first) window.setTimeout(() => first.focus(), 40);
  }

  function channelOptions(selected = '') {
    return `<option value="" disabled ${selected ? '' : 'selected'}>Elige canal…</option>${CHANNELS.map((channel) => `<option value="${channel.id}" ${channel.id === selected ? 'selected' : ''}>${channel.symbol} ${escapeHtml(channel.label)}</option>`).join('')}`;
  }

  function openLeadDialog() {
    const body = `<div class="form-group"><label for="leadName">Nombre del negocio o alias *</label><input class="field" id="leadName" name="name" maxlength="120" autocomplete="off" required placeholder="Ej. Café del Centro"></div>
      <div class="form-group"><label for="leadIndustry">Industria / giro</label><input class="field" id="leadIndustry" name="industry" maxlength="80" autocomplete="off" placeholder="Ej. Alimentos y bebidas"></div>
      <div class="inline-note">El prospecto se agrega a <strong>Por trabajar</strong>. No ingresa a tus metas hasta que registres un toque real y lo muevas a Calificación.</div>`;
    openDialog(dialogFrame('Nuevo prospecto', 'Solo datos mínimos; sin correos ni teléfonos.', `<form id="leadForm">${body}</form>`, `<button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="submit" form="leadForm">Guardar en Por trabajar</button>`));
  }

  function openEditLeadDialog(leadId) {
    const lead = state.prospects.find((item) => item.id === leadId);
    if (!lead) return;
    const body = `<div class="form-group"><label for="editLeadName">Nombre del negocio o alias *</label><input class="field" id="editLeadName" name="name" maxlength="120" value="${escapeHtml(lead.name)}" required></div>
      <div class="form-group"><label for="editLeadIndustry">Industria / giro</label><input class="field" id="editLeadIndustry" name="industry" maxlength="80" value="${escapeHtml(lead.industry)}"></div>
      <div class="inline-note">Editar estos datos no cambia la etapa ni altera tu historial de actividades.</div>`;
    openDialog(dialogFrame('Editar datos mínimos', 'No se admiten teléfono, correo ni notas.', `<form id="editLeadForm" data-id="${escapeHtml(lead.id)}">${body}</form>`, `<button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="submit" form="editLeadForm">Guardar cambios</button>`));
  }

  function openActivityDialog(leadId, targetStage = null) {
    const lead = state.prospects.find((item) => item.id === leadId);
    if (!lead) return;
    const allowed = allowedTargets(lead);
    const options = targetStage ? `<div class="form-group"><label for="targetStage">Mover a etapa *</label><select class="select-field" id="targetStage" name="targetStage" required>${STAGES.filter((stage) => allowed.includes(stage.id)).map((stage) => `<option value="${stage.id}" ${stage.id === targetStage ? 'selected' : ''}>${escapeHtml(stage.label)}</option>`).join('')}</select></div>` : '';
    const title = targetStage ? 'Registrar y cambiar etapa' : 'Registrar toque directo';
    const description = targetStage ? `El movimiento de “${lead.name}” se guarda junto con esta actividad.` : `Actividad individual para “${lead.name}”. Las campañas YAMM van aparte.`;
    const body = `<div class="inline-note">Elige lo que ocurrió. No se piden comentarios ni contenido del mensaje.</div>${options}
      <div class="form-row"><div class="form-group"><label for="activityChannel">Canal *</label><select class="select-field" id="activityChannel" name="channel" required>${channelOptions()}</select></div><div class="form-group"><label for="activityConnected">Resultado *</label><select class="select-field" id="activityConnected" name="connected" required><option value="" disabled selected>Elige resultado…</option><option value="false">Sin conexión / respuesta</option><option value="true">Conectó / respondió</option></select></div></div>
      <div class="form-hint">Fecha y hora se registran automáticamente. “Correo directo” no incluye correos de campaña.</div>`;
    openDialog(dialogFrame(title, description, `<form id="activityForm" data-id="${escapeHtml(leadId)}" data-move="${targetStage ? '1' : '0'}">${body}</form>`, `<button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="submit" form="activityForm">${targetStage ? 'Guardar toque y mover' : 'Guardar toque'}</button>`));
  }

  function allowedTargets(lead) {
    if (lead.stage === 'backlog') return ['qualification'];
    if (lead.stage === 'qualification') return ['negotiation', 'backlog'];
    if (lead.stage === 'negotiation') return ['closing', 'qualification'];
    if (lead.stage === 'closing') return ['won', 'lost', 'negotiation'];
    if (lead.stage === 'won') return ['closing'];
    if (lead.stage === 'lost') return ['closing', 'negotiation', 'qualification'];
    return STAGES.filter((stage) => stage.id !== lead.stage).map((stage) => stage.id);
  }

  function openMoveDialog(leadId, suggestedStage = null) {
    const lead = state.prospects.find((item) => item.id === leadId);
    if (!lead) return;
    const targets = allowedTargets(lead);
    if (suggestedStage && !targets.includes(suggestedStage)) {
      toast('Avanza una etapa a la vez. Registra el toque para confirmar el movimiento.', 'error');
      return;
    }
    openActivityDialog(leadId, suggestedStage || targets[0]);
  }

  function openCampaignDialog() {
    const industries = [...new Set(state.prospects.map((lead) => lead.industry).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'es-MX'));
    const industryOptions = [`<option value="Sin segmento">Sin segmento</option>`, ...industries.map((industry) => `<option value="${escapeHtml(industry)}">${escapeHtml(industry)}</option>`), `<option value="Otro">Otro / varios</option>`].join('');
    const body = `<div class="form-group"><label for="campaignLabel">Identificador de campaña *</label><input class="field" id="campaignLabel" name="label" maxlength="100" required placeholder="Ej. YAMM-Restaurantes-Nov-1"></div>
      <div class="form-row"><div class="form-group"><label for="campaignDate">Fecha *</label><input class="field" id="campaignDate" name="date" type="date" value="${dateOnly()}" required></div><div class="form-group"><label for="campaignIndustry">Industria / segmento</label><select class="select-field" id="campaignIndustry" name="industry">${industryOptions}</select></div></div>
      <div class="form-row"><div class="form-group"><label for="campaignSent">Correos enviados *</label><input class="field" id="campaignSent" name="sent" type="number" min="0" step="1" value="0" required></div><div class="form-group"><label for="campaignReplies">Respuestas reportadas *</label><input class="field" id="campaignReplies" name="replies" type="number" min="0" step="1" value="0" required></div></div>
      <div class="inline-note">No ingreses destinatarios, correos ni nombres de respuesta. Solo los totales agregados del reporte YAMM. Este registro no suma como correo directo por negocio.</div>`;
    openDialog(dialogFrame('Registrar campaña YAMM', 'Mantén el mailing masivo fuera del funnel individual.', `<form id="campaignForm">${body}</form>`, `<button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="submit" form="campaignForm">Guardar totales</button>`));
  }

  function openCsvHelp() {
    toast('Selecciona un CSV con encabezados de negocio/nombre e industria/giro. El navegador descartará las demás columnas.', '');
    csvInput.click();
  }

  function openCsvPreview(records, ignoredRows, duplicateRows) {
    pendingImport = records;
    const sample = records.slice(0, 5).map((record) => `<div>• ${escapeHtml(record.name)} <span class="muted">${record.industry ? `— ${escapeHtml(record.industry)}` : ''}</span></div>`).join('') || '<div>No se detectaron filas válidas.</div>';
    const body = `<div class="privacy-card"><div><strong>Importación dentro del navegador</strong><br>No se envía el archivo a un servidor. Solo se conservarán nombre del negocio y la industria; correo, teléfono y demás columnas se descartan.</div></div>
      <div class="csv-preview"><strong>${num(records.length)} prospecto(s) nuevo(s) listos para importar</strong><br>${num(duplicateRows)} duplicado(s) omitido(s) · ${num(ignoredRows)} fila(s) sin nombre omitida(s)<div class="csv-sample">${sample}</div></div>
      <div class="form-hint">Todos se agregan a “Por trabajar”. Importar la lista no cuenta contra la meta de Calificación.</div>`;
    openDialog(dialogFrame('Vista previa del CSV', 'Revisa la muestra; el archivo original no se guarda.', body, `<button class="button button-quiet" type="button" data-close>Cancelar</button><button class="button button-primary" type="button" data-action="confirm-csv" ${records.length ? '' : 'disabled'}>Importar a Por trabajar</button>`));
  }

  function parseCsv(text) {
    const content = String(text || '').replace(/^\uFEFF/, '');
    const firstLine = content.split(/\r?\n/, 1)[0] || '';
    const delimiters = [',', ';', '\t'];
    const delimiter = delimiters.map((candidate) => ({ candidate, count: (firstLine.match(new RegExp(candidate === '\t' ? '\\t' : candidate.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g')) || []).length })).sort((a,b) => b.count - a.count)[0]?.candidate || ',';
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;
    for (let i = 0; i < content.length; i += 1) {
      const char = content[i];
      if (char === '"') {
        if (quoted && content[i + 1] === '"') { value += '"'; i += 1; }
        else quoted = !quoted;
      } else if (!quoted && char === delimiter) {
        row.push(value); value = '';
      } else if (!quoted && (char === '\n' || char === '\r')) {
        if (char === '\r' && content[i + 1] === '\n') i += 1;
        row.push(value); value = '';
        if (row.some((cell) => String(cell).trim())) rows.push(row);
        row = [];
      } else value += char;
    }
    row.push(value);
    if (row.some((cell) => String(cell).trim())) rows.push(row);
    return rows;
  }

  function normalizedHeader(value) {
    return String(value || '').trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }

  function detectHeaderIndex(headers, tokens) {
    const excluded = /(email|correo|mail|telefono|phone|celular|contacto|contact|persona|nombrepersona|nombrecontacto|firstname|lastname|owner)/;
    return headers.findIndex((original) => {
      const header = normalizedHeader(original);
      return !excluded.test(header) && tokens.some((token) => header === token || header.includes(token));
    });
  }

  async function handleCsvFile(file) {
    if (!file) return;
    try {
      let text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error('El CSV debe incluir encabezados y al menos una fila de prospecto.');
      const headers = rows[0].map((cell) => shortText(cell, 100));
      const nameIndex = detectHeaderIndex(headers, ['nombrecomercio', 'nombrenegocio', 'nombreempresa', 'businessname', 'companyname', 'comercio', 'negocio', 'empresa', 'company', 'business', 'seller', 'prospect', 'leadname', 'nombre']);
      const industryIndex = detectHeaderIndex(headers, ['industria', 'giro', 'sector', 'industry', 'vertical']);
      if (nameIndex < 0) throw new Error('No encuentro la columna del negocio. Usa un encabezado como “Nombre del negocio” o “Comercio”.');
      const existing = new Set(state.prospects.map((lead) => `${normalKey(lead.name)}|${normalKey(lead.industry)}`));
      const seen = new Set(existing);
      const records = [];
      let duplicates = 0;
      let ignored = 0;
      rows.slice(1).forEach((cells) => {
        const name = shortText(cells[nameIndex], 120);
        if (!name || name.includes('@') || /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(name)) { ignored += 1; return; }
        const industry = industryIndex >= 0 ? shortText(cells[industryIndex], 80) || 'Sin industria' : 'Sin industria';
        const key = `${normalKey(name)}|${normalKey(industry)}`;
        if (seen.has(key)) { duplicates += 1; return; }
        seen.add(key);
        records.push({ name, industry });
      });
      // Do not retain source text or other CSV columns after extracting the permitted fields.
      openCsvPreview(records, ignored, duplicates);
      text = '';
      rows.length = 0;
    } catch (error) {
      toast(error.message || 'No se pudo leer el CSV.', 'error');
    } finally {
      csvInput.value = '';
    }
  }

  function normalKey(value) {
    return String(value || '').toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function addCampaign(formData) {
    const label = shortText(formData.get('label'), 100);
    const date = String(formData.get('date') || dateOnly());
    const industry = shortText(formData.get('industry'), 80) || 'Sin segmento';
    const sent = clampInt(formData.get('sent'), 0, 10000000, 0);
    const replies = clampInt(formData.get('replies'), 0, sent, 0);
    if (!label || label.includes('@')) return toast('Usa un identificador de campaña, no una dirección de correo.', 'error');
    if (Number(formData.get('replies')) > sent) return toast('Las respuestas no pueden superar los correos enviados.', 'error');
    state.campaigns.push({ id: makeId(), label, date: dateFromISOInput(date), industry, sent, replies });
    if (saveState()) { closeDialog(); render(); toast('Campaña agregada. No alteró los toques directos.'); }
  }

  function recordActivity(formData, leadId, targetStage = null) {
    const lead = state.prospects.find((item) => item.id === leadId);
    if (!lead) return toast('No encontré ese negocio.', 'error');
    const channel = String(formData.get('channel') || '');
    if (!CHANNELS.some((item) => item.id === channel)) return toast('Selecciona un canal válido.', 'error');
    const connected = formData.get('connected') === 'true';
    const allowed = allowedTargets(lead);
    if (targetStage && !allowed.includes(targetStage)) return toast('Ese movimiento no está permitido desde la etapa actual.', 'error');
    const now = new Date().toISOString();
    lead.activities.push({ id: makeId(), at: now, channel, connected });
    if (targetStage) {
      lead.stage = targetStage;
      lead.stageChangedAt = now;
      lead.stageHistory.push({ stage: targetStage, at: now });
    }
    if (saveState()) {
      closeDialog();
      render();
      toast(targetStage ? `Toque registrado y etapa actualizada a ${stageLabel(targetStage)}.` : 'Toque registrado en el negocio.');
    }
  }

  function addProspect(formData) {
    const name = shortText(formData.get('name'), 120);
    const industry = shortText(formData.get('industry'), 80) || 'Sin industria';
    if (!name || name.includes('@')) return toast('Escribe el nombre o alias del negocio, no un correo.', 'error');
    const duplicate = state.prospects.some((lead) => normalKey(lead.name) === normalKey(name) && normalKey(lead.industry) === normalKey(industry));
    if (duplicate) return toast('Ya existe un negocio con ese nombre e industria.', 'error');
    const now = new Date().toISOString();
    state.prospects.push({ id: makeId(), name, industry, stage: 'backlog', createdAt: now, stageChangedAt: now, stageHistory: [{ stage: 'backlog', at: now }], activities: [] });
    if (saveState()) { closeDialog(); render(); toast('Prospecto guardado en Por trabajar.'); }
  }

  function editProspect(formData, leadId) {
    const lead = state.prospects.find((item) => item.id === leadId);
    if (!lead) return toast('No encontré ese negocio.', 'error');
    const name = shortText(formData.get('name'), 120);
    const industry = shortText(formData.get('industry'), 80) || 'Sin industria';
    if (!name || name.includes('@')) return toast('Usa el nombre del negocio o un alias, no un correo.', 'error');
    const duplicate = state.prospects.some((item) => item.id !== leadId && normalKey(item.name) === normalKey(name) && normalKey(item.industry) === normalKey(industry));
    if (duplicate) return toast('Ya existe otro negocio con ese nombre e industria.', 'error');
    lead.name = name;
    lead.industry = industry;
    if (saveState()) { closeDialog(); render(); toast('Datos mínimos actualizados.'); }
  }

  function confirmCsvImport() {
    if (!pendingImport.length) return;
    const now = new Date().toISOString();
    const leads = pendingImport.map((record) => ({ id: makeId(), name: shortText(record.name, 120), industry: shortText(record.industry, 80) || 'Sin industria', stage: 'backlog', createdAt: now, stageChangedAt: now, stageHistory: [{ stage: 'backlog', at: now }], activities: [] }));
    state.prospects.push(...leads);
    const count = leads.length;
    pendingImport = [];
    if (saveState()) { closeDialog(); render(); toast(`${num(count)} prospecto(s) importado(s) a Por trabajar. No cuentan como calificados.`); }
  }

  function exportBackup() {
    const payload = { format: 'tono-local-crm', version: APP_VERSION, exportedAt: new Date().toISOString(), state: sanitizeState(state) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ritmo-respaldo-${dateOnly()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Respaldo local descargado. Guárdalo en un lugar aprobado.');
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = sanitizeState(parsed.state || parsed);
      if (!window.confirm(`El respaldo contiene ${num(imported.prospects.length)} negocios y ${num(imported.campaigns.length)} campañas. Reemplazará los datos locales actuales. ¿Continuar?`)) return;
      state = imported;
      if (saveState()) { currentView = 'dashboard'; navTo('dashboard'); toast('Respaldo restaurado en este navegador.'); }
    } catch (error) {
      toast('No se pudo restaurar el JSON. Verifica que sea un respaldo válido.', 'error');
    } finally {
      jsonInput.value = '';
    }
  }

  function saveGoals(formData) {
    state.settings.dailyQualificationTarget = clampInt(formData.get('dailyTarget'), 1, 500, 8);
    state.settings.weeklyTargets = {
      qualification: clampInt(formData.get('goalQualification'), 0, 10000, 40),
      negotiation: clampInt(formData.get('goalNegotiation'), 0, 10000, 12),
      closing: clampInt(formData.get('goalClosing'), 0, 10000, 3),
    };
    const monthOne = String(formData.get('monthOne') || '');
    if (/^\d{4}-\d{2}$/.test(monthOne)) state.settings.monthOne = monthOne;
    state.settings.monthlySellerTargets = [1, 2, 3, 4, 5].map((month) => clampInt(formData.get(`monthlyTarget${month}`), 0, 1000, [2, 4, 5, 6, 6][month - 1]));
    if (saveState()) { render(); toast('Metas actualizadas.'); }
  }

  function toast(message, type = '') {
    const node = document.createElement('div');
    node.className = `toast ${type}`.trim();
    node.textContent = message;
    toastRegion.appendChild(node);
    window.setTimeout(() => node.remove(), 4200);
  }

  function refreshProspectTable() {
    if (currentView !== 'prospects') return;
    const scroll = appView.querySelector('.table-wrap');
    const position = scroll ? scroll.scrollLeft : 0;
    appView.innerHTML = renderProspects();
    const nextScroll = appView.querySelector('.table-wrap');
    if (nextScroll) nextScroll.scrollLeft = position;
  }

  document.querySelectorAll('.nav-link[data-view]').forEach((button) => button.addEventListener('click', () => navTo(button.dataset.view)));
  document.getElementById('newLeadButton').addEventListener('click', openLeadDialog);
  document.getElementById('exportButton').addEventListener('click', exportBackup);
  document.getElementById('privacyInfoButton').addEventListener('click', () => navTo('settings'));
  csvInput.addEventListener('change', (event) => handleCsvFile(event.target.files?.[0]));
  jsonInput.addEventListener('change', (event) => importBackup(event.target.files?.[0]));

  appView.addEventListener('click', (event) => {
    const periodButton = event.target.closest('[data-period]');
    if (periodButton) { selectedPeriod = periodButton.dataset.period; render(); return; }
    const viewButton = event.target.closest('[data-view-link]');
    if (viewButton) { navTo(viewButton.dataset.viewLink); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const { action, id } = actionButton.dataset;
    if (action === 'add-lead') openLeadDialog();
    else if (action === 'import-csv') openCsvHelp();
    else if (action === 'activity') openActivityDialog(id);
    else if (action === 'move') openMoveDialog(id);
    else if (action === 'edit-lead') openEditLeadDialog(id);
    else if (action === 'add-campaign') openCampaignDialog();
    else if (action === 'confirm-csv') confirmCsvImport();
    else if (action === 'prospect-page') {
      const filteredCount = state.prospects.filter((lead) => {
        const q = prospectFilter.q.toLocaleLowerCase('es-MX');
        const matchesText = !q || `${lead.name} ${lead.industry}`.toLocaleLowerCase('es-MX').includes(q);
        return matchesText && (prospectFilter.stage === 'all' || lead.stage === prospectFilter.stage);
      }).length;
      prospectFilter.page = Math.max(1, Math.min(Math.ceil(filteredCount / 50) || 1, prospectFilter.page + Number(actionButton.dataset.delta || 0)));
      render();
    }
    else if (action === 'delete-campaign') {
      const campaign = state.campaigns.find((item) => item.id === id);
      if (campaign && window.confirm(`¿Eliminar la campaña “${campaign.label}”?`)) {
        state.campaigns = state.campaigns.filter((item) => item.id !== id);
        if (saveState()) { render(); toast('Campaña eliminada.'); }
      }
    }
  });

  appView.addEventListener('input', (event) => {
    if (event.target.id === 'prospectSearch') {
      prospectFilter.q = event.target.value;
      prospectFilter.page = 1;
      refreshProspectTable();
      const search = document.getElementById('prospectSearch');
      if (search) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
    }
  });

  appView.addEventListener('change', (event) => {
    if (event.target.id === 'stageFilter') { prospectFilter.stage = event.target.value; prospectFilter.page = 1; refreshProspectTable(); }
  });

  appView.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    if (form.id === 'leadForm') addProspect(data);
    else if (form.id === 'activityForm') recordActivity(data, form.dataset.id, form.dataset.move === '1' ? String(data.get('targetStage') || '') : null);
    else if (form.id === 'campaignForm') addCampaign(data);
    else if (form.id === 'goalsForm') saveGoals(data);
  });

  appView.addEventListener('click', (event) => {
    if (event.target.id === 'settingsExportJson') exportBackup();
    if (event.target.id === 'settingsImportJson') jsonInput.click();
    if (event.target.id === 'clearDataButton' && window.confirm('¿Borrar todos los prospectos, actividades y campañas guardados en este navegador? Esta acción no se puede deshacer.')) {
      state = makeDefaultState();
      if (saveState()) { render(); toast('Se borraron los datos locales.'); }
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) closeDialog();
    const action = event.target.closest('[data-action]');
    if (action?.dataset.action === 'confirm-csv') confirmCsvImport();
  });
  dialog.addEventListener('submit', (event) => {
    if (event.target.id === 'leadForm' || event.target.id === 'editLeadForm' || event.target.id === 'activityForm' || event.target.id === 'campaignForm') {
      // Submit is handled by the delegated appView listener only if the dialog is inside it; handle dialog forms here.
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      if (form.id === 'leadForm') addProspect(data);
      else if (form.id === 'editLeadForm') editProspect(data, form.dataset.id);
      else if (form.id === 'activityForm') recordActivity(data, form.dataset.id, form.dataset.move === '1' ? String(data.get('targetStage') || '') : null);
      else if (form.id === 'campaignForm') addCampaign(data);
    }
  });

  appView.addEventListener('dragstart', (event) => {
    const card = event.target.closest('.deal-card');
    if (!card) return;
    draggingLeadId = card.dataset.leadId;
    card.classList.add('is-dragging');
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggingLeadId); }
  });
  appView.addEventListener('dragend', (event) => {
    const card = event.target.closest('.deal-card');
    if (card) card.classList.remove('is-dragging');
    document.querySelectorAll('.board-column.is-drop-target').forEach((column) => column.classList.remove('is-drop-target'));
    draggingLeadId = null;
  });
  appView.addEventListener('dragover', (event) => {
    const column = event.target.closest('.board-column');
    if (!column) return;
    event.preventDefault();
    column.classList.add('is-drop-target');
  });
  appView.addEventListener('dragleave', (event) => {
    const column = event.target.closest('.board-column');
    if (column && !column.contains(event.relatedTarget)) column.classList.remove('is-drop-target');
  });
  appView.addEventListener('drop', (event) => {
    const column = event.target.closest('.board-column');
    if (!column || !draggingLeadId) return;
    event.preventDefault();
    column.classList.remove('is-drop-target');
    const lead = state.prospects.find((item) => item.id === draggingLeadId);
    const target = column.dataset.dropStage;
    if (lead && target && lead.stage !== target) openMoveDialog(lead.id, target);
  });

  function init() {
    render();
    // Keep unknown properties out of persistent storage even after restoring an old export.
    if (!saveState()) {
      const storageChip = document.querySelector('.storage-chip');
      if (storageChip) { storageChip.textContent = 'Solo memoria'; storageChip.classList.add('storage-error'); }
    }
  }

  init();
})();
