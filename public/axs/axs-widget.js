/* ═══════════════════════════════════════════════════════════════
   AXS Accessibility Widget — JavaScript
   Bykov-Brett Enterprises
   Self-contained IIFE, zero framework dependencies
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ─── Configuration ───
  // DR public build: tailnet AI/chat API is unreachable publicly, so chat +
  // AI-assist are disabled and the API base is neutralised. All client-side
  // accessibility features work with no backend.
  const ENABLE_CHAT = false;
  const AXS_API = '';
  const PREFS_KEY = 'axs-prefs';
  const SESSION_KEY = 'axs-session-id';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── State ───
  var state = {};
  try { state = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch(e) { state = {}; }

  var panelOpen = false;
  var activeTab = 'access';
  var triggerButton = null;
  var rsvpInstance = null;
  var readPageInstance = null;
  var ttsEnabled = false;
  var ttsHighlightedEl = null;
  var voiceNavActive = false;
  var voiceRecognition = null;
  var readingGuideEl = null;
  var structurePanel = null;
  var bionicApplied = false;
  var originalTexts = new Map();
  var injectedStyles = {};
  var chatMessages = [];
  var chatLoading = false;

  // ─── SVG Icons ───
  var ICONS = {
    accessibility: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><circle cx="12" cy="3.6" r="2.1"/><path d="M21 8.4c0 .66-.55 1.16-1.27 1.07L15 8.9v3.1l2.18 7.2c.2.7-.19 1.42-.9 1.62-.7.2-1.42-.19-1.62-.9L12.85 14h-1.7l-1.81 5.92c-.2.71-.92 1.1-1.62.9-.71-.2-1.1-.92-.9-1.62L9 12V8.9l-4.73.57C3.55 9.56 3 9.06 3 8.4c0-.6.42-1.05 1-1.13L12 6.1l8 1.17c.58.08 1 .53 1 1.13z"/></svg>',
    chat: '<img src="https://25517737.fs1.hubspotusercontent-eu1.net/hubfs/25517737/axs-widget/chatbot-icon.png" alt="Chat" style="width:36px;height:36px;">',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12a10 10 0 0117.07-7.07M22 12a10 10 0 01-17.07 7.07"/><path d="M2 4v8h8M22 20v-8h-8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    accessTab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><path d="M12 8v4m-4-2h8M10 14l-2 8m6-8l2 8"/></svg>',
    chatTab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    treize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    darkMode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20" fill="currentColor" opacity="0.3"/></svg>',
    greyscale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20z" fill="currentColor" fill-opacity="0.15"/></svg>',
    textSize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/><path d="M9 12h6"/></svg>',
    lineHeight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    dyslexic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="4" y="17" font-size="14" font-weight="bold" fill="currentColor" stroke="none">Df</text></svg>',
    focusRead: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    readGuide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="18" height="4" rx="1"/><path d="M3 6h18M3 18h18" opacity="0.3"/></svg>',
    rsvp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>',
    readPage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>',
    tts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/></svg>',
    voiceNav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><circle cx="12" cy="22" r="1" fill="currentColor"/></svg>',
    stopAnim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    hideImages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 3l18 14M21 3L3 17"/></svg>',
    bigCursor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 8-6 1-3 6z"/></svg>',
    highlightLinks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    structure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>',
    summarise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    simplify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h6"/></svg>',
    describeImg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    voiceSettings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>'
  };

  // ─── Utility Functions ───
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(key) {
        if (key === 'className') node.className = attrs[key];
        else if (key === 'innerHTML') node.innerHTML = attrs[key];
        else if (key === 'textContent') node.textContent = attrs[key];
        else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function(c) {
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else if (c) node.appendChild(c);
      });
    }
    return node;
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(state)); } catch(e) {}
  }

  function getSessionId() {
    var sid = null;
    try { sid = localStorage.getItem(SESSION_KEY); } catch(e) {}
    if (!sid) {
      sid = 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function() {
        return (Math.random() * 16 | 0).toString(16);
      });
      try { localStorage.setItem(SESSION_KEY, sid); } catch(e) {}
    }
    return sid;
  }

  function getPageText() {
    var source = document.querySelector('main') || document.querySelector('article') || document.querySelector('[role="main"]') || document.body;
    var clone = source.cloneNode(true);
    var removeSelectors = ['script', 'style', 'nav', 'footer', 'header', 'noscript', '#axs-widget-root'];
    removeSelectors.forEach(function(sel) {
      clone.querySelectorAll(sel).forEach(function(n) { n.remove(); });
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function injectStyleTag(id, css) {
    removeStyleTag(id);
    var style = document.createElement('style');
    style.id = 'axs-injected-' + id;
    style.textContent = css;
    document.head.appendChild(style);
    injectedStyles[id] = true;
  }

  function removeStyleTag(id) {
    var existing = document.getElementById('axs-injected-' + id);
    if (existing) existing.remove();
    delete injectedStyles[id];
  }

  // ─── DOM References (set after injection) ───
  var root, fabStack, panel, backdrop;
  var fabAccess, fabChat;
  var tabAccess, tabChat, viewAccess, viewChat;
  var searchInput, noResults;
  var aiCard, aiCardText, aiCardBadge;
  var chatMessagesContainer, chatInput, chatSendBtn, chipsContainer;
  var rsvpOverlay;
  var textSizeLabel;
  var profileSelect;

  // ═══════════════════════════════════════════════════════════════
  // DOM INJECTION
  // ═══════════════════════════════════════════════════════════════
  function buildWidget() {
    root = el('div', { id: 'axs-widget-root' });

    // Backdrop
    backdrop = el('div', { className: 'axs-backdrop', onClick: function() { closePanel(); } });
    root.appendChild(backdrop);

    // FABs
    fabStack = el('div', { className: 'axs-fab-stack' });
    fabAccess = el('button', {
      className: 'axs-fab axs-fab--access',
      'data-tip': 'Accessibility',
      'aria-label': 'Open accessibility options',
      'aria-expanded': 'false',
      innerHTML: ICONS.accessibility,
      onClick: function() { triggerButton = fabAccess; openPanel('access'); }
    });
    fabChat = el('button', {
      className: 'axs-fab axs-fab--chat',
      'data-tip': 'Chat',
      'aria-label': 'Chat with AI assistant',
      'aria-expanded': 'false',
      innerHTML: ICONS.chat,
      onClick: function() { triggerButton = fabChat; openPanel('chat'); }
    });
    fabStack.appendChild(fabAccess);
    if (ENABLE_CHAT) fabStack.appendChild(fabChat);
    root.appendChild(fabStack);

    // Panel
    panel = el('div', {
      className: 'axs-panel',
      role: 'dialog',
      'aria-label': 'Accessibility and chat panel',
      'aria-modal': 'true'
    });

    // Header
    var header = el('div', { className: 'axs-panel__header' });
    var tabs = el('div', { className: 'axs-panel__tabs', role: 'tablist' });
    tabAccess = el('button', {
      className: 'axs-panel__tab axs-active',
      role: 'tab',
      'aria-selected': 'true',
      'aria-controls': 'axs-view-access',
      id: 'axs-tab-access',
      innerHTML: ICONS.accessTab + ' Accessibility',
      onClick: function() { switchTab('access'); }
    });
    tabChat = el('button', {
      className: 'axs-panel__tab',
      role: 'tab',
      'aria-selected': 'false',
      'aria-controls': 'axs-view-chat',
      id: 'axs-tab-chat',
      innerHTML: ICONS.chatTab + ' Chat',
      onClick: function() { switchTab('chat'); }
    });
    tabs.appendChild(tabAccess);
    if (ENABLE_CHAT) tabs.appendChild(tabChat);

    var actions = el('div', { className: 'axs-panel__actions' });
    var resetBtn = el('button', {
      className: 'axs-panel__btn',
      'aria-label': 'Reset all accessibility settings',
      title: 'Reset all settings',
      innerHTML: ICONS.reset,
      onClick: function() { resetAll(); }
    });
    var closeBtn = el('button', {
      className: 'axs-panel__btn',
      'aria-label': 'Close panel',
      innerHTML: ICONS.close,
      onClick: function() { closePanel(); }
    });
    actions.appendChild(resetBtn);
    actions.appendChild(closeBtn);
    header.appendChild(tabs);
    header.appendChild(actions);
    panel.appendChild(header);

    // Panel Body
    var body = el('div', { className: 'axs-panel__body' });

    // ─── Accessibility View ───
    viewAccess = el('div', {
      className: 'axs-view axs-active',
      id: 'axs-view-access',
      role: 'tabpanel',
      'aria-labelledby': 'axs-tab-access'
    });

    // AI result card
    aiCard = el('div', { className: 'axs-ai-card' });
    var aiCardHeader = el('div', { className: 'axs-ai-card__header' });
    aiCardHeader.innerHTML = ICONS.check;
    aiCardBadge = el('span', { className: 'axs-ai-card__badge', textContent: 'AI Result' });
    aiCardHeader.appendChild(aiCardBadge);
    aiCardText = el('div', { className: 'axs-ai-card__text' });
    var aiCardAction = el('button', {
      className: 'axs-ai-card__action',
      textContent: 'Continue in chat \u2192',
      onClick: function() { switchTab('chat'); }
    });
    aiCard.appendChild(aiCardHeader);
    aiCard.appendChild(aiCardText);
    aiCard.appendChild(aiCardAction);
    viewAccess.appendChild(aiCard);

    // Search
    var searchWrap = el('div', { className: 'axs-search' });
    var searchInner = el('div', { className: 'axs-search__wrap' });
    var searchIcon = el('span', { className: 'axs-search__icon', innerHTML: ICONS.search });
    searchInput = el('input', {
      className: 'axs-search__input',
      type: 'text',
      placeholder: 'Search features...',
      'aria-label': 'Search accessibility features',
      onInput: function() { filterFeatures(); }
    });
    searchInner.appendChild(searchIcon);
    searchInner.appendChild(searchInput);
    searchWrap.appendChild(searchInner);
    viewAccess.appendChild(searchWrap);

    // Profiles dropdown
    var profilesWrap = el('div', { className: 'axs-profiles' });
    profileSelect = el('select', {
      className: 'axs-profiles__select',
      'aria-label': 'Accessibility profiles',
      onChange: function() { applyProfile(this.value); }
    });
    var profiles = [
      { value: '', label: 'Select a profile...' },
      { value: 'standard', label: 'Standard (Reset All)' },
      { value: 'adhd', label: 'ADHD-Friendly' },
      { value: 'lowvision', label: 'Low Vision' },
      { value: 'dyslexia', label: 'Dyslexia-Friendly' },
      { value: 'screenreader', label: 'Screen Reader Optimised' },
      { value: 'keyboard', label: 'Keyboard Navigation' },
      { value: 'cognitive', label: 'Cognitive' }
    ];
    profiles.forEach(function(p) {
      var opt = el('option', { value: p.value, textContent: p.label });
      profileSelect.appendChild(opt);
    });
    profilesWrap.appendChild(profileSelect);
    viewAccess.appendChild(profilesWrap);

    // Language selector (Google Translate)
    var langWrap = el('div', { className: 'axs-language' });
    var langLabel = el('div', { className: 'axs-section__title', textContent: 'LANGUAGE' });
    langWrap.appendChild(langLabel);
    var langSelect = el('select', {
      className: 'axs-language__select',
      'aria-label': 'Translate page to another language',
      onChange: function() { translatePage(this.value); }
    });
    var langs = [
      { value: '', label: '\uD83C\uDDEC\uD83C\uDDE7 English (Original)' },
      { value: 'fr', label: '\uD83C\uDDEB\uD83C\uDDF7 Fran\u00e7ais' },
      { value: 'de', label: '\uD83C\uDDE9\uD83C\uDDEA Deutsch' },
      { value: 'es', label: '\uD83C\uDDEA\uD83C\uDDF8 Espa\u00f1ol' },
      { value: 'it', label: '\uD83C\uDDEE\uD83C\uDDF9 Italiano' },
      { value: 'pt', label: '\uD83C\uDDF5\uD83C\uDDF9 Portugu\u00eas' },
      { value: 'nl', label: '\uD83C\uDDF3\uD83C\uDDF1 Nederlands' },
      { value: 'pl', label: '\uD83C\uDDF5\uD83C\uDDF1 Polski' },
      { value: 'ja', label: '\uD83C\uDDEF\uD83C\uDDF5 \u65E5\u672C\u8A9E' },
      { value: 'zh-CN', label: '\uD83C\uDDE8\uD83C\uDDF3 \u4E2D\u6587' },
      { value: 'ko', label: '\uD83C\uDDF0\uD83C\uDDF7 \uD55C\uAD6D\uC5B4' },
      { value: 'ar', label: '\uD83C\uDDF8\uD83C\uDDE6 \u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
      { value: 'hi', label: '\uD83C\uDDEE\uD83C\uDDF3 \u0939\u093F\u0928\u094D\u0926\u0940' },
      { value: 'ru', label: '\uD83C\uDDF7\uD83C\uDDFA \u0420\u0443\u0441\u0441\u043A\u0438\u0439' }
    ];
    langs.forEach(function(l) {
      langSelect.appendChild(el('option', { value: l.value, textContent: l.label }));
    });
    langWrap.appendChild(langSelect);
    viewAccess.appendChild(langWrap);

    // Load Google Translate (hidden, we use our own UI)
    loadGoogleTranslate();

    // No results message
    noResults = el('div', { className: 'axs-no-results', textContent: 'No features found' });
    viewAccess.appendChild(noResults);

    // Scrollable features container
    var featuresScroll = el('div', { className: 'axs-features-scroll' });

    // ─── VISUAL Section ───
    featuresScroll.appendChild(buildSection('visual', 'Visual', [
      buildFeatureToggle('darkMode', 'Dark Mode', 'Invert page colours', 'visual', ICONS.darkMode, toggleDarkMode),
      buildFeatureContrast(),
      buildFeatureToggle('greyscale', 'Greyscale', 'Remove all colour', 'visual', ICONS.greyscale, toggleGreyscale)
    ]));

    // ─── READING Section ───
    featuresScroll.appendChild(buildSection('reading', 'Reading', [
      buildFeatureTextSize(),
      buildFeatureToggle('lineHeight', 'Line Height', 'Increase line spacing', 'reading', ICONS.lineHeight, toggleLineHeight),
      buildFeatureToggle('dyslexicFont', 'Dyslexic Font', 'OpenDyslexic typeface', 'reading', ICONS.dyslexic, toggleDyslexicFont),
      buildFeatureToggle('focusRead', 'Focus Read', 'Highlight first syllables', 'reading', ICONS.focusRead, toggleFocusRead),
      buildFeatureToggle('readingGuide', 'Reading Guide', 'Ruler follows cursor', 'reading', ICONS.readGuide, toggleReadingGuide),
      buildFeatureToggle('rsvp', 'RSVP Reading', 'Word-at-a-time speed reading', 'reading', ICONS.rsvp, toggleRSVP)
    ]));

    // ─── AUDIO Section ───
    featuresScroll.appendChild(buildSection('audio', 'Audio', [
      buildVoiceSettings(),
      buildFeatureToggle('readPage', 'Read Page', 'Read content aloud', 'audio', ICONS.readPage, toggleReadPage),
      buildFeatureToggle('tts', 'Text to Speech', 'Click text to hear it', 'audio', ICONS.tts, toggleTTS),
      buildFeatureToggle('voiceNav', 'Voice Navigation', 'Speak commands', 'audio', ICONS.voiceNav, toggleVoiceNav)
    ]));

    // ─── COGNITIVE AI Section ───
    featuresScroll.appendChild(buildSection('cognitive', 'Cognitive AI', [
      buildFeatureAction('summarise', 'Summarise Page', 'AI-generated summary', 'cognitive', ICONS.summarise, doSummarise, true),
      buildFeatureAction('simplify', 'Simplify Content', 'Easier to read', 'cognitive', ICONS.simplify, doSimplify, true),
      buildFeatureAction('describeImages', 'Describe Images', 'Alt text for images', 'cognitive', ICONS.describeImg, doDescribeImages, true)
    ]));

    // ─── NAVIGATION Section ───
    featuresScroll.appendChild(buildSection('nav', 'Navigation', [
      buildFeatureToggle('stopAnimations', 'Stop Animations', 'Pause all motion', 'nav', ICONS.stopAnim, toggleStopAnimations),
      buildFeatureToggle('hideImages', 'Hide Images', 'Remove visual media', 'nav', ICONS.hideImages, toggleHideImages),
      buildFeatureToggle('bigCursor', 'Big Cursor', 'Larger mouse pointer', 'nav', ICONS.bigCursor, toggleBigCursor),
      buildFeatureToggle('highlightLinks', 'Highlight Links', 'Outline all links', 'nav', ICONS.highlightLinks, toggleHighlightLinks),
      buildFeatureToggle('pageStructure', 'Page Structure', 'View heading outline', 'nav', ICONS.structure, togglePageStructure)
    ]));

    var spacer = el('div');
    spacer.style.height = '16px';
    featuresScroll.appendChild(spacer);

    viewAccess.appendChild(featuresScroll);
    body.appendChild(viewAccess);

    // ─── Chat View ───
    viewChat = el('div', {
      className: 'axs-view',
      id: 'axs-view-chat',
      role: 'tabpanel',
      'aria-labelledby': 'axs-tab-chat'
    });
    viewChat.appendChild(buildChatView());
    body.appendChild(viewChat);

    panel.appendChild(body);

    // Footer
    var footer = el('div', { className: 'axs-panel__footer' });
    footer.appendChild(el('span', { className: 'axs-panel__footer-text', textContent: 'Powered by Bykov-Brett Enterprises' }));
    var footerLinks = el('div', { className: 'axs-panel__footer-links' });
    footerLinks.appendChild(el('a', {
      className: 'axs-panel__footer-link',
      href: 'https://bykovbrett.net/policy#accessibility-statement',
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: 'Accessibility Statement'
    }));
    footerLinks.appendChild(el('a', {
      className: 'axs-panel__footer-link',
      href: 'https://bykovbrett.net/policy#privacy-policy',
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: 'Privacy'
    }));
    footer.appendChild(footerLinks);
    panel.appendChild(footer);

    root.appendChild(panel);

    // RSVP Overlay
    rsvpOverlay = buildRSVPOverlay();
    root.appendChild(rsvpOverlay);

    // Reading Guide
    readingGuideEl = el('div', { className: 'axs-reading-guide' });
    root.appendChild(readingGuideEl);

    // Page Structure Sidebar
    structurePanel = buildStructurePanel();
    root.appendChild(structurePanel);

    // Append to <html> (not body) so dark mode body filter doesn't affect widget
    document.documentElement.appendChild(root);

    // Full-screen background layer for chat on mobile — outside widget root to avoid stacking context issues
    var chatBg = document.createElement('div');
    chatBg.id = 'axs-chat-bg';
    chatBg.style.cssText = 'display:none;position:fixed;top:-200px;left:0;width:100vw;height:calc(100% + 400px);background:#111111;z-index:99997;pointer-events:none;';
    document.documentElement.insertBefore(chatBg, root);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION & FEATURE BUILDERS
  // ═══════════════════════════════════════════════════════════════
  function buildSection(category, title, features) {
    var section = el('div', { className: 'axs-section axs-section--' + category });
    section.appendChild(el('div', { className: 'axs-section__title', textContent: title }));
    features.forEach(function(f) { if (f) section.appendChild(f); });
    return section;
  }

  function buildFeatureToggle(key, name, desc, category, icon, handler) {
    var row = el('div', {
      className: 'axs-feature',
      'data-feature': key,
      'data-name': name.toLowerCase(),
      role: 'switch',
      'aria-checked': state[key] ? 'true' : 'false',
      'aria-label': name + ': ' + desc,
      tabindex: '0'
    });

    var iconBox = el('div', { className: 'axs-feature__icon axs-feature__icon--' + category, innerHTML: icon });
    var info = el('div', { className: 'axs-feature__info' });
    info.appendChild(el('div', { className: 'axs-feature__name', textContent: name }));
    if (desc) info.appendChild(el('div', { className: 'axs-feature__desc', textContent: desc }));

    var toggle = el('div', { className: 'axs-toggle' + (state[key] ? ' axs-on' : '') });

    row.appendChild(iconBox);
    row.appendChild(info);
    row.appendChild(toggle);

    function doToggle() {
      state[key] = !state[key];
      toggle.classList.toggle('axs-on', state[key]);
      row.setAttribute('aria-checked', state[key] ? 'true' : 'false');
      savePrefs();
      if (handler) handler(state[key]);
    }

    row.addEventListener('click', doToggle);
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doToggle(); }
    });

    return row;
  }

  function buildFeatureContrast() {
    var row = el('div', {
      className: 'axs-feature',
      'data-feature': 'contrast',
      'data-name': 'contrast',
      'aria-label': 'Contrast adjustment'
    });
    var iconBox = el('div', { className: 'axs-feature__icon axs-feature__icon--visual', innerHTML: ICONS.contrast });
    var info = el('div', { className: 'axs-feature__info' });
    info.appendChild(el('div', { className: 'axs-feature__name', textContent: 'Contrast' }));

    var group = el('div', { className: 'axs-contrast-group', role: 'radiogroup', 'aria-label': 'Contrast level' });
    ['off', 'high', 'low'].forEach(function(level) {
      var btn = el('button', {
        className: 'axs-contrast-btn' + ((state.contrast || 'off') === level ? ' axs-active' : ''),
        role: 'radio',
        'aria-checked': ((state.contrast || 'off') === level) ? 'true' : 'false',
        'aria-label': level.charAt(0).toUpperCase() + level.slice(1) + ' contrast',
        textContent: level.charAt(0).toUpperCase() + level.slice(1),
        onClick: function(e) {
          e.stopPropagation();
          state.contrast = level;
          savePrefs();
          group.querySelectorAll('.axs-contrast-btn').forEach(function(b) {
            b.classList.remove('axs-active');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('axs-active');
          btn.setAttribute('aria-checked', 'true');
          applyContrast(level);
        }
      });
      group.appendChild(btn);
    });

    row.appendChild(iconBox);
    row.appendChild(info);
    row.appendChild(group);
    return row;
  }

  function buildFeatureTextSize() {
    var row = el('div', {
      className: 'axs-feature',
      'data-feature': 'textSize',
      'data-name': 'text size',
      'aria-label': 'Text size adjustment'
    });
    var iconBox = el('div', { className: 'axs-feature__icon axs-feature__icon--reading', innerHTML: ICONS.textSize });
    var info = el('div', { className: 'axs-feature__info' });
    info.appendChild(el('div', { className: 'axs-feature__name', textContent: 'Text Size' }));
    info.appendChild(el('div', { className: 'axs-feature__desc', textContent: 'Increase or decrease' }));

    var controls = el('div', { className: 'axs-text-size-controls' });
    var minusBtn = el('button', {
      className: 'axs-text-size-btn',
      'aria-label': 'Decrease text size',
      textContent: '\u2212',
      onClick: function(e) { e.stopPropagation(); adjustTextSize(-10); }
    });
    textSizeLabel = el('span', {
      className: 'axs-text-size-label',
      textContent: (state.textSize || 100) + '%',
      'aria-live': 'polite'
    });
    var plusBtn = el('button', {
      className: 'axs-text-size-btn',
      'aria-label': 'Increase text size',
      textContent: '+',
      onClick: function(e) { e.stopPropagation(); adjustTextSize(10); }
    });

    controls.appendChild(minusBtn);
    controls.appendChild(textSizeLabel);
    controls.appendChild(plusBtn);

    row.appendChild(iconBox);
    row.appendChild(info);
    row.appendChild(controls);
    return row;
  }

  function buildFeatureAction(key, name, desc, category, icon, handler, isAI) {
    var row = el('div', {
      className: 'axs-feature',
      'data-feature': key,
      'data-name': name.toLowerCase(),
      role: 'button',
      'aria-label': name + ': ' + desc,
      tabindex: '0'
    });
    var iconBox = el('div', { className: 'axs-feature__icon axs-feature__icon--' + category, innerHTML: icon });
    var info = el('div', { className: 'axs-feature__info' });
    var nameEl = el('div', { className: 'axs-feature__name' });
    nameEl.appendChild(document.createTextNode(name + ' '));
    if (isAI) {
      nameEl.appendChild(el('span', { className: 'axs-badge-ai', textContent: 'AI' }));
    }
    info.appendChild(nameEl);
    if (desc) info.appendChild(el('div', { className: 'axs-feature__desc', textContent: desc }));

    row.appendChild(iconBox);
    row.appendChild(info);

    row.addEventListener('click', function() { if (handler) handler(); });
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (handler) handler(); }
    });

    return row;
  }

  function buildVoiceSettings() {
    var row = el('div', {
      className: 'axs-feature',
      'data-feature': 'voiceSettings',
      'data-name': 'voice settings',
      'aria-label': 'Voice settings for text to speech'
    });
    var iconBox = el('div', { className: 'axs-feature__icon axs-feature__icon--audio', innerHTML: ICONS.voiceSettings });
    var info = el('div', { className: 'axs-feature__info' });
    info.appendChild(el('div', { className: 'axs-feature__name', textContent: 'Voice Settings' }));
    info.appendChild(el('div', { className: 'axs-feature__desc', textContent: 'Choose TTS voice' }));

    var selectWrap = el('div', { className: 'axs-voice-select' });
    var select = el('select', { 'aria-label': 'Select voice' });
    select.appendChild(el('option', { value: '', textContent: 'Default' }));
    selectWrap.appendChild(select);

    row.appendChild(iconBox);
    row.appendChild(info);
    row.appendChild(selectWrap);

    // Load voices
    function populateVoices() {
      if (!window.speechSynthesis) return;
      var voices = speechSynthesis.getVoices();
      if (!voices.length) return;
      // Clear previous options except default
      while (select.options.length > 1) select.remove(1);
      voices.forEach(function(v, i) {
        var opt = el('option', { value: String(i), textContent: v.name + ' (' + v.lang + ')' });
        if (state.voiceIndex !== undefined && state.voiceIndex === i) opt.selected = true;
        select.appendChild(opt);
      });
    }

    if (window.speechSynthesis) {
      populateVoices();
      speechSynthesis.addEventListener('voiceschanged', populateVoices);
    }

    select.addEventListener('change', function() {
      state.voiceIndex = this.value ? parseInt(this.value, 10) : undefined;
      savePrefs();
    });

    return row;
  }

  // ═══════════════════════════════════════════════════════════════
  // RSVP OVERLAY
  // ═══════════════════════════════════════════════════════════════
  function buildRSVPOverlay() {
    var overlay = el('div', { className: 'axs-rsvp-overlay', role: 'dialog', 'aria-label': 'RSVP speed reading mode' });

    var closeBtn = el('button', {
      className: 'axs-rsvp__close',
      'aria-label': 'Close RSVP reader',
      innerHTML: ICONS.close,
      onClick: function() { closeRSVP(); }
    });

    var wordDisplay = el('div', { className: 'axs-rsvp__word', id: 'axs-rsvp-word', 'aria-live': 'off', textContent: 'Ready' });

    var progressBar = el('div', { className: 'axs-rsvp__progress-bar' });
    var progressFill = el('div', { className: 'axs-rsvp__progress-fill', id: 'axs-rsvp-progress' });
    progressBar.appendChild(progressFill);

    var controls = el('div', { className: 'axs-rsvp__controls' });
    var speedDown = el('button', {
      className: 'axs-rsvp__btn',
      'aria-label': 'Decrease speed',
      textContent: '\u2212',
      onClick: function() { adjustRSVPSpeed(-50); }
    });
    var playPause = el('button', {
      className: 'axs-rsvp__btn',
      'aria-label': 'Play or pause',
      id: 'axs-rsvp-playpause',
      textContent: '\u25B6',
      onClick: function() { toggleRSVPPlayPause(); }
    });
    var speedUp = el('button', {
      className: 'axs-rsvp__btn',
      'aria-label': 'Increase speed',
      textContent: '+',
      onClick: function() { adjustRSVPSpeed(50); }
    });
    var speedLabel = el('div', {
      className: 'axs-rsvp__speed',
      id: 'axs-rsvp-speed',
      'aria-live': 'polite',
      textContent: (state.rsvpWPM || 300) + ' WPM'
    });

    controls.appendChild(speedDown);
    controls.appendChild(playPause);
    controls.appendChild(speedUp);
    controls.appendChild(speedLabel);

    overlay.appendChild(closeBtn);
    overlay.appendChild(wordDisplay);
    overlay.appendChild(progressBar);
    overlay.appendChild(controls);

    return overlay;
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE STRUCTURE SIDEBAR
  // ═══════════════════════════════════════════════════════════════
  function buildStructurePanel() {
    var panel = el('div', { className: 'axs-structure', role: 'navigation', 'aria-label': 'Page heading structure' });

    var header = el('div', { className: 'axs-structure__header' });
    header.appendChild(el('div', { className: 'axs-structure__title', textContent: 'Page Structure' }));
    var closeBtn = el('button', {
      className: 'axs-structure__close',
      'aria-label': 'Close page structure',
      innerHTML: ICONS.close,
      onClick: function() { togglePageStructure(false); }
    });
    header.appendChild(closeBtn);

    var list = el('div', { className: 'axs-structure__list', id: 'axs-structure-list' });

    panel.appendChild(header);
    panel.appendChild(list);
    return panel;
  }

  function populateStructure() {
    var list = document.getElementById('axs-structure-list');
    if (!list) return;
    list.innerHTML = '';
    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(function(h) {
      if (root && root.contains(h)) return; // skip widget headings
      var level = parseInt(h.tagName.charAt(1), 10);
      var text = h.textContent.trim();
      if (!text) return;
      var item = el('button', {
        className: 'axs-structure__item',
        'data-level': String(level),
        textContent: text,
        onClick: function() {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          h.focus();
        }
      });
      list.appendChild(item);
    });
    if (!list.children.length) {
      list.appendChild(el('div', {
        className: 'axs-structure__item',
        textContent: 'No headings found on this page'
      }));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHAT VIEW
  // ═══════════════════════════════════════════════════════════════
  function buildChatView() {
    var chat = el('div', { className: 'axs-chat' });

    // Identity section
    var identity = el('div', { className: 'axs-chat__identity' });
    var avatar = el('div', { className: 'axs-chat__avatar', innerHTML: ICONS.treize });
    identity.appendChild(avatar);
    identity.appendChild(el('div', { className: 'axs-chat__name', textContent: 'TREIZE' }));
    identity.appendChild(el('div', { className: 'axs-chat__role', textContent: 'AI Assistant \u2014 Bykov-Brett Enterprises' }));
    chat.appendChild(identity);

    // Messages
    chatMessagesContainer = el('div', {
      className: 'axs-chat__messages',
      role: 'log',
      'aria-label': 'Chat conversation with Treize',
      'aria-live': 'polite',
      'aria-relevant': 'additions',
      tabindex: '0'
    });
    chat.appendChild(chatMessagesContainer);

    // Quick chips
    chipsContainer = el('div', { className: 'axs-chips' });
    var chips = ['What services do you offer?', 'Book a call', 'AI readiness', 'Summarise this page'];
    chips.forEach(function(text) {
      var chip = el('button', {
        className: 'axs-chip',
        textContent: text,
        onClick: function() { sendChatMessage(text); }
      });
      chipsContainer.appendChild(chip);
    });
    chat.appendChild(chipsContainer);

    // Input area
    var inputArea = el('div', { className: 'axs-chat__input-area' });
    var inputWrap = el('div', { className: 'axs-chat__input-wrap' });
    chatInput = el('input', {
      className: 'axs-chat__input',
      type: 'text',
      placeholder: 'Ask Treize anything...',
      'aria-label': 'Chat message input',
      onKeydown: function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var msg = chatInput.value.trim();
          if (msg) sendChatMessage(msg);
        }
      }
    });
    chatSendBtn = el('button', {
      className: 'axs-chat__send',
      'aria-label': 'Send message',
      innerHTML: ICONS.send,
      onClick: function() {
        var msg = chatInput.value.trim();
        if (msg) sendChatMessage(msg);
      }
    });
    inputWrap.appendChild(chatInput);
    inputWrap.appendChild(chatSendBtn);
    inputArea.appendChild(inputWrap);
    chat.appendChild(inputArea);

    // Mobile keyboard handling — hide footer, cover page background
    chatInput.addEventListener('focus', function() {
      var footer = document.querySelector('#axs-widget-root .axs-panel__footer');
      if (footer) footer.classList.add('axs-footer-hidden');
      // Set body background to match chat so nothing bleeds through
      if (window.innerWidth <= 768) {
        document.body.dataset.axsOrigBg = document.body.style.backgroundColor || '';
        document.documentElement.dataset.axsOrigBg = document.documentElement.style.backgroundColor || '';
        document.body.style.backgroundColor = '#111111';
        document.documentElement.style.backgroundColor = '#111111';
        // Set theme-color meta tag — iOS uses this to colour the area behind the keyboard
        var existingTheme = document.querySelector('meta[name="theme-color"]');
        if (existingTheme) {
          document.body.dataset.axsOrigTheme = existingTheme.getAttribute('content') || '';
          existingTheme.setAttribute('content', '#111111');
        } else {
          var themeMeta = document.createElement('meta');
          themeMeta.name = 'theme-color';
          themeMeta.content = '#111111';
          themeMeta.id = 'axs-theme-color';
          document.head.appendChild(themeMeta);
        }
      }
    });
    chatInput.addEventListener('blur', function() {
      setTimeout(function() {
        var footer = document.querySelector('#axs-widget-root .axs-panel__footer');
        if (footer) footer.classList.remove('axs-footer-hidden');
        // Restore body background
        if (document.body.dataset.axsOrigBg !== undefined) {
          document.body.style.backgroundColor = document.body.dataset.axsOrigBg;
          document.documentElement.style.backgroundColor = document.documentElement.dataset.axsOrigBg || '';
          // Restore theme-color
          var existingTheme = document.querySelector('meta[name="theme-color"]');
          if (existingTheme && document.body.dataset.axsOrigTheme !== undefined) {
            existingTheme.setAttribute('content', document.body.dataset.axsOrigTheme);
            delete document.body.dataset.axsOrigTheme;
          }
          var addedTheme = document.getElementById('axs-theme-color');
          if (addedTheme) addedTheme.remove();
          delete document.body.dataset.axsOrigBg;
          delete document.documentElement.dataset.axsOrigBg;
        }
      }, 300);
    });

    return chat;
  }

  // ═══════════════════════════════════════════════════════════════
  // PANEL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  var savedScrollY = 0;

  function lockBodyScroll() {
    if (window.innerWidth > 768) return;
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    if (document.body.style.position !== 'fixed') return;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }

  function openPanel(tab) {
    panelOpen = true;
    panel.classList.add('axs-open');
    backdrop.classList.add('axs-visible');
    fabStack.classList.add('axs-hidden');
    fabAccess.setAttribute('aria-expanded', 'true');
    fabChat.setAttribute('aria-expanded', 'true');
    lockBodyScroll();
    switchTab(tab || 'access');

    // Focus first interactive element after transition
    setTimeout(function() {
      var firstFocusable = panel.querySelector('button, input, select, [tabindex="0"]');
      if (firstFocusable) firstFocusable.focus();
    }, reducedMotion ? 10 : 380);
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove('axs-open');
    backdrop.classList.remove('axs-visible');
    fabStack.classList.remove('axs-hidden');
    fabAccess.setAttribute('aria-expanded', 'false');
    fabChat.setAttribute('aria-expanded', 'false');
    var chatBg = document.getElementById('axs-chat-bg');
    if (chatBg) chatBg.style.display = 'none';
    unlockBodyScroll();
    // Restore backgrounds
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';

    // Return focus to trigger button
    if (triggerButton) {
      setTimeout(function() { triggerButton.focus(); }, reducedMotion ? 10 : 380);
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    tabAccess.classList.toggle('axs-active', tab === 'access');
    tabChat.classList.toggle('axs-active', tab === 'chat');
    tabAccess.setAttribute('aria-selected', tab === 'access' ? 'true' : 'false');
    tabChat.setAttribute('aria-selected', tab === 'chat' ? 'true' : 'false');
    viewAccess.classList.toggle('axs-active', tab === 'access');
    viewChat.classList.toggle('axs-active', tab === 'chat');

    // Show/hide full-screen chat backdrop on mobile only
    var chatBg = document.getElementById('axs-chat-bg');
    var isMobile = window.innerWidth <= 768;
    if (chatBg) chatBg.style.display = (tab === 'chat' && isMobile) ? 'block' : 'none';
    // Set backgrounds on mobile when chat opens
    if (tab === 'chat' && isMobile) {
      document.body.style.backgroundColor = '#111111';
      document.documentElement.style.backgroundColor = '#111111';
    } else if (isMobile) {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    }

    if (tab === 'chat' && chatMessages.length === 0) {
      addBotMessage("Hello! I'm Treize, the AI assistant for Bykov-Brett Enterprises. I can help you learn about our AI training, consulting, and advisory services. What would you like to know?");
    }
  }

  // ─── Focus Trap ───
  function handleFocusTrap(e) {
    if (!panelOpen || e.key !== 'Tab') return;

    var focusableEls = panel.querySelectorAll(
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'
    );
    if (!focusableEls.length) return;

    var firstEl = focusableEls[0];
    var lastEl = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SEARCH / FILTER
  // ═══════════════════════════════════════════════════════════════
  function filterFeatures() {
    var query = searchInput.value.toLowerCase().trim();
    var features = viewAccess.querySelectorAll('.axs-feature');
    var visibleCount = 0;

    features.forEach(function(f) {
      var name = f.getAttribute('data-name') || '';
      if (!query || name.indexOf(query) !== -1) {
        f.classList.remove('axs-feature--hidden');
        visibleCount++;
      } else {
        f.classList.add('axs-feature--hidden');
      }
    });

    // Show/hide sections with no visible features
    viewAccess.querySelectorAll('.axs-section').forEach(function(section) {
      var visibleFeatures = section.querySelectorAll('.axs-feature:not(.axs-feature--hidden)');
      section.style.display = visibleFeatures.length > 0 ? '' : 'none';
    });

    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY FEATURES — VISUAL
  // ═══════════════════════════════════════════════════════════════
  function toggleDarkMode(on) {
    document.documentElement.classList.toggle('axs-dark-mode', on);
  }

  function applyContrast(level) {
    removeStyleTag('contrast');
    if (level === 'high') {
      injectStyleTag('contrast', 'html { filter: contrast(1.5) !important; } #axs-widget-root, #axs-widget-root * { filter: none !important; }');
    } else if (level === 'low') {
      injectStyleTag('contrast', 'html { filter: contrast(0.75) !important; } #axs-widget-root, #axs-widget-root * { filter: none !important; }');
    }
  }

  function toggleGreyscale(on) {
    if (on) {
      injectStyleTag('greyscale', 'html { filter: grayscale(1) !important; } #axs-widget-root, #axs-widget-root * { filter: none !important; }');
    } else {
      removeStyleTag('greyscale');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY FEATURES — READING
  // ═══════════════════════════════════════════════════════════════
  function adjustTextSize(delta) {
    var current = state.textSize || 100;
    current = Math.max(90, Math.min(200, current + delta));
    state.textSize = current;
    savePrefs();
    document.documentElement.style.fontSize = current + '%';
    if (textSizeLabel) textSizeLabel.textContent = current + '%';
  }

  function toggleLineHeight(on) {
    if (on) {
      injectStyleTag('lineHeight', 'body *:not(#axs-widget-root):not(#axs-widget-root *) { line-height: 1.8 !important; }');
    } else {
      removeStyleTag('lineHeight');
    }
  }

  function toggleDyslexicFont(on) {
    document.documentElement.classList.toggle('axs-dyslexic', on);
  }

  function toggleFocusRead(on) {
    if (on) {
      applyBionicReading();
    } else {
      removeBionicReading();
    }
  }

  function applyBionicReading() {
    if (bionicApplied) return;
    var source = document.querySelector('main') || document.querySelector('article') || document.body;
    var walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        // Skip widget and script/style nodes
        if (root && root.contains(node)) return NodeFilter.FILTER_REJECT;
        var parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function(node) {
      var words = node.textContent.split(/(\s+)/);
      var fragment = document.createDocumentFragment();

      words.forEach(function(word) {
        if (/^\s+$/.test(word) || word.length === 0) {
          fragment.appendChild(document.createTextNode(word));
          return;
        }
        var boldLen = word.length <= 3 ? 1 : Math.ceil(word.length * 0.4);
        var span = document.createElement('span');
        span.setAttribute('data-axs-bionic', 'true');
        span.innerHTML = '<b>' + escapeHTML(word.slice(0, boldLen)) + '</b>' + escapeHTML(word.slice(boldLen));
        fragment.appendChild(span);
      });

      if (node.parentNode) {
        node.parentNode.replaceChild(fragment, node);
      }
    });
    bionicApplied = true;
  }

  function removeBionicReading() {
    if (!bionicApplied) return;
    document.querySelectorAll('[data-axs-bionic]').forEach(function(span) {
      var text = span.textContent;
      span.replaceWith(document.createTextNode(text));
    });
    bionicApplied = false;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function toggleReadingGuide(on) {
    if (on) {
      readingGuideEl.classList.add('axs-visible');
      document.addEventListener('mousemove', moveReadingGuide);
    } else {
      readingGuideEl.classList.remove('axs-visible');
      document.removeEventListener('mousemove', moveReadingGuide);
    }
  }

  function moveReadingGuide(e) {
    readingGuideEl.style.top = (e.clientY - 20) + 'px';
  }

  // ─── RSVP Reading Mode ───
  function toggleRSVP(on) {
    if (on) {
      openRSVP();
    } else {
      closeRSVP();
    }
  }

  function openRSVP() {
    var text = getPageText();
    if (!text) return;

    var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
    if (!words.length) return;

    rsvpOverlay.classList.add('axs-visible');
    var wpm = state.rsvpWPM || 300;
    var wordEl = document.getElementById('axs-rsvp-word');
    var progressEl = document.getElementById('axs-rsvp-progress');
    var speedEl = document.getElementById('axs-rsvp-speed');
    var playPauseEl = document.getElementById('axs-rsvp-playpause');

    var index = 0;
    var running = false;
    var timer = null;

    function showWord() {
      if (!running || index >= words.length) {
        if (index >= words.length) {
          wordEl.textContent = 'Done';
          playPauseEl.textContent = '\u25B6';
          running = false;
        }
        return;
      }

      var word = words[index];
      wordEl.textContent = word;
      progressEl.style.width = ((index / words.length) * 100) + '%';

      var baseDelay = 60000 / wpm;
      // Adaptive timing: longer words get more time
      var lengthFactor = 1 + Math.max(0, word.length - 6) * 0.1;
      // Punctuation pause
      var punctFactor = /[.!?;:]$/.test(word) ? 1.5 : (/[,]$/.test(word) ? 1.2 : 1);
      var delay = baseDelay * lengthFactor * punctFactor;

      index++;
      timer = setTimeout(showWord, delay);
    }

    function play() {
      running = true;
      playPauseEl.textContent = '\u275A\u275A';
      showWord();
    }

    function pause() {
      running = false;
      playPauseEl.textContent = '\u25B6';
      if (timer) { clearTimeout(timer); timer = null; }
    }

    rsvpInstance = {
      togglePlayPause: function() {
        if (running) pause(); else { if (index >= words.length) index = 0; play(); }
      },
      adjustSpeed: function(delta) {
        wpm = Math.max(150, Math.min(600, wpm + delta));
        state.rsvpWPM = wpm;
        savePrefs();
        speedEl.textContent = wpm + ' WPM';
      },
      destroy: function() {
        pause();
        rsvpInstance = null;
      }
    };

    speedEl.textContent = wpm + ' WPM';
    wordEl.textContent = 'Press play to start';
    progressEl.style.width = '0%';
    playPauseEl.textContent = '\u25B6';
  }

  function closeRSVP() {
    rsvpOverlay.classList.remove('axs-visible');
    if (rsvpInstance) rsvpInstance.destroy();
    // Also unset the toggle
    state.rsvp = false;
    savePrefs();
    var toggle = viewAccess.querySelector('[data-feature="rsvp"] .axs-toggle');
    if (toggle) toggle.classList.remove('axs-on');
    var row = viewAccess.querySelector('[data-feature="rsvp"]');
    if (row) row.setAttribute('aria-checked', 'false');
  }

  function toggleRSVPPlayPause() {
    if (rsvpInstance) rsvpInstance.togglePlayPause();
  }

  function adjustRSVPSpeed(delta) {
    if (rsvpInstance) rsvpInstance.adjustSpeed(delta);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY FEATURES — AUDIO
  // ═══════════════════════════════════════════════════════════════
  function getSelectedVoice() {
    if (!window.speechSynthesis) return null;
    var voices = speechSynthesis.getVoices();
    if (state.voiceIndex !== undefined && voices[state.voiceIndex]) {
      return voices[state.voiceIndex];
    }
    return null;
  }

  function toggleReadPage(on) {
    if (on) {
      startReadPage();
    } else {
      stopReadPage();
    }
  }

  function startReadPage() {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();

    var text = getPageText();
    if (!text) return;

    // Split into sentences to handle Chrome 15s limit
    var sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    var sentenceIndex = 0;

    function speakNext() {
      if (sentenceIndex >= sentences.length) {
        readPageInstance = null;
        // Turn off toggle
        state.readPage = false;
        savePrefs();
        var toggle = viewAccess.querySelector('[data-feature="readPage"] .axs-toggle');
        if (toggle) toggle.classList.remove('axs-on');
        var row = viewAccess.querySelector('[data-feature="readPage"]');
        if (row) row.setAttribute('aria-checked', 'false');
        return;
      }

      var utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex].trim());
      var voice = getSelectedVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = function() {
        sentenceIndex++;
        if (!stopped) speakNext();
      };
      utterance.onerror = function() {
        sentenceIndex++;
        if (!stopped) speakNext();
      };

      speechSynthesis.speak(utterance);
    }

    var stopped = false;
    readPageInstance = {
      stop: function() {
        stopped = true;
        speechSynthesis.cancel();
        readPageInstance = null;
      }
    };

    function guardedSpeakNext() { if (!stopped) speakNext(); }
    speakNext();
  }

  function stopReadPage() {
    if (readPageInstance) readPageInstance.stop();
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function toggleTTS(on) {
    ttsEnabled = on;
    if (on) {
      document.addEventListener('click', handleTTSClick, true);
    } else {
      document.removeEventListener('click', handleTTSClick, true);
      if (window.speechSynthesis) speechSynthesis.cancel();
      if (ttsHighlightedEl) {
        ttsHighlightedEl.style.outline = '';
        ttsHighlightedEl = null;
      }
    }
  }

  function handleTTSClick(e) {
    if (!ttsEnabled) return;
    // Don't intercept widget clicks
    if (root && root.contains(e.target)) return;

    var target = e.target.closest('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, span, div');
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    if (window.speechSynthesis) speechSynthesis.cancel();

    // Clear previous highlight
    if (ttsHighlightedEl) {
      ttsHighlightedEl.style.outline = '';
    }

    if (ttsHighlightedEl === target) {
      // Re-clicking same element stops speech
      ttsHighlightedEl = null;
      return;
    }

    ttsHighlightedEl = target;
    target.style.outline = '2px solid #065F46';

    var text = target.textContent.trim();
    if (!text) return;

    var utterance = new SpeechSynthesisUtterance(text);
    var voice = getSelectedVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = function() {
      if (ttsHighlightedEl === target) {
        target.style.outline = '';
        ttsHighlightedEl = null;
      }
    };

    speechSynthesis.speak(utterance);
  }

  function toggleVoiceNav(on) {
    if (on) {
      startVoiceNav();
    } else {
      stopVoiceNav();
    }
  }

  function startVoiceNav() {
    var SpeechRecog = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecog) {
      // Feature not supported
      showAICard('Voice Navigation', 'Voice navigation requires Chrome or Edge browser. This feature is not available in your current browser.');
      // Turn off the toggle
      state.voiceNav = false;
      savePrefs();
      var toggle = viewAccess.querySelector('[data-feature="voiceNav"] .axs-toggle');
      if (toggle) toggle.classList.remove('axs-on');
      var row = viewAccess.querySelector('[data-feature="voiceNav"]');
      if (row) row.setAttribute('aria-checked', 'false');
      return;
    }

    voiceRecognition = new SpeechRecog();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = false;
    voiceRecognition.lang = 'en-GB';

    voiceRecognition.onresult = function(event) {
      var last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      var command = last[0].transcript.toLowerCase().trim();
      processVoiceCommand(command);
    };

    voiceRecognition.onend = function() {
      // Restart if still active
      if (voiceNavActive && voiceRecognition) {
        try { voiceRecognition.start(); } catch(e) {}
      }
    };

    voiceRecognition.onerror = function(e) {
      if (e.error === 'not-allowed') {
        showAICard('Voice Navigation', 'Microphone permission denied. Please allow microphone access to use voice navigation.');
        state.voiceNav = false;
        savePrefs();
        var toggle = viewAccess.querySelector('[data-feature="voiceNav"] .axs-toggle');
        if (toggle) toggle.classList.remove('axs-on');
        var row = viewAccess.querySelector('[data-feature="voiceNav"]');
        if (row) row.setAttribute('aria-checked', 'false');
        voiceNavActive = false;
      }
    };

    voiceNavActive = true;
    try { voiceRecognition.start(); } catch(e) {}
  }

  function stopVoiceNav() {
    voiceNavActive = false;
    if (voiceRecognition) {
      try { voiceRecognition.stop(); } catch(e) {}
      voiceRecognition = null;
    }
  }

  function processVoiceCommand(command) {
    if (command.indexOf('scroll down') !== -1) {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    } else if (command.indexOf('scroll up') !== -1) {
      window.scrollBy({ top: -400, behavior: 'smooth' });
    } else if (command.indexOf('go to top') !== -1 || command.indexOf('top of page') !== -1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (command.indexOf('go to bottom') !== -1 || command.indexOf('bottom of page') !== -1) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (command.indexOf('go to ') !== -1) {
      var target = command.replace('go to ', '').trim();
      var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(function(h) {
        if (h.textContent.toLowerCase().indexOf(target) !== -1) {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } else if (command.indexOf('click ') !== -1) {
      var linkText = command.replace('click ', '').trim();
      var links = document.querySelectorAll('a, button');
      links.forEach(function(link) {
        if (link.textContent.toLowerCase().indexOf(linkText) !== -1) {
          link.click();
        }
      });
    } else if (command.indexOf('close') !== -1) {
      closePanel();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY FEATURES — COGNITIVE AI
  // ═══════════════════════════════════════════════════════════════
  function showAICard(title, text) {
    aiCardBadge.textContent = title;
    aiCardText.textContent = text;
    aiCard.classList.add('axs-visible');
  }

  function hideAICard() {
    aiCard.classList.remove('axs-visible');
  }

  function doSummarise() {
    var pageText = getPageText();
    if (!pageText) return;
    showAICard('AI Summary', 'Generating summary...');

    fetch(AXS_API + '/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'summarise', content: pageText.slice(0, 8000) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.result) {
        showAICard('AI Summary', data.result);
      } else if (data.error) {
        showAICard('AI Summary', 'Error: ' + data.error);
      }
    })
    .catch(function() {
      showAICard('AI Summary', 'Unable to generate summary. Please try again later.');
    });
  }

  function doSimplify() {
    var pageText = getPageText();
    if (!pageText) return;
    showAICard('Simplify Content', 'Simplifying...');

    fetch(AXS_API + '/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'simplify', content: pageText.slice(0, 8000) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.result) {
        // Store originals for reset
        var source = document.querySelector('main') || document.querySelector('article') || document.body;
        var paragraphs = source.querySelectorAll('p');
        if (!originalTexts.size) {
          paragraphs.forEach(function(p) {
            if (!root.contains(p)) {
              originalTexts.set(p, p.innerHTML);
            }
          });
        }
        showAICard('Simplified', data.result);
      } else if (data.error) {
        showAICard('Simplify Content', 'Error: ' + data.error);
      }
    })
    .catch(function() {
      showAICard('Simplify Content', 'Unable to simplify content. Please try again later.');
    });
  }

  function doDescribeImages() {
    var images = document.querySelectorAll('img:not(#axs-widget-root img)');
    if (!images.length) {
      showAICard('Describe Images', 'No images found on this page.');
      return;
    }
    showAICard('Describe Images', 'Image descriptions require a vision-capable model. GPT-4.1 nano does not support image analysis. Images with alt text: ' + Array.from(images).filter(function(img) { return img.alt; }).length + '/' + images.length);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY FEATURES — NAVIGATION
  // ═══════════════════════════════════════════════════════════════
  function toggleStopAnimations(on) {
    if (on) {
      injectStyleTag('stopAnim',
        '*:not(#axs-widget-root):not(#axs-widget-root *), ' +
        '*:not(#axs-widget-root):not(#axs-widget-root *)::before, ' +
        '*:not(#axs-widget-root):not(#axs-widget-root *)::after { ' +
        'animation-duration: 0s !important; animation-delay: 0s !important; ' +
        'transition-duration: 0s !important; transition-delay: 0s !important; }'
      );
      // Pause all videos
      document.querySelectorAll('video').forEach(function(v) {
        if (!root.contains(v)) v.pause();
      });
    } else {
      removeStyleTag('stopAnim');
    }
  }

  function toggleHideImages(on) {
    if (on) {
      injectStyleTag('hideImages',
        'img:not(#axs-widget-root img), ' +
        'svg:not(#axs-widget-root svg), ' +
        'video:not(#axs-widget-root video), ' +
        '[role="img"]:not(#axs-widget-root [role="img"]), ' +
        'picture:not(#axs-widget-root picture) { visibility: hidden !important; }'
      );
    } else {
      removeStyleTag('hideImages');
    }
  }

  function toggleBigCursor(on) {
    if (on) {
      // 32px black arrow cursor as inline SVG data URI
      var cursorSVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M5 3l22 12-10 2-4 10z' fill='%23000' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E";
      injectStyleTag('bigCursor',
        '*:not(#axs-widget-root):not(#axs-widget-root *) { cursor: url("' + cursorSVG + '") 4 2, auto !important; }'
      );
    } else {
      removeStyleTag('bigCursor');
    }
  }

  function toggleHighlightLinks(on) {
    if (on) {
      injectStyleTag('highlightLinks',
        'a:not(#axs-widget-root a) { ' +
        'outline: 3px solid #065F46 !important; ' +
        'outline-offset: 2px !important; ' +
        'text-decoration: underline !important; }'
      );
    } else {
      removeStyleTag('highlightLinks');
    }
  }

  function togglePageStructure(on) {
    if (on) {
      populateStructure();
      structurePanel.classList.add('axs-visible');
    } else {
      structurePanel.classList.remove('axs-visible');
      state.pageStructure = false;
      savePrefs();
      var toggle = viewAccess.querySelector('[data-feature="pageStructure"] .axs-toggle');
      if (toggle) toggle.classList.remove('axs-on');
      var row = viewAccess.querySelector('[data-feature="pageStructure"]');
      if (row) row.setAttribute('aria-checked', 'false');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY PROFILES
  // ═══════════════════════════════════════════════════════════════
  var PROFILES = {
    adhd: { stopAnimations: true, focusRead: true, readingGuide: true, contrast: 'high' },
    lowvision: { textSizeBoost: 30, contrast: 'high', bigCursor: true, highlightLinks: true, lineHeight: true },
    dyslexia: { dyslexicFont: true, lineHeight: true, textSizeBoost: 10, focusRead: true },
    screenreader: { pageStructure: true, stopAnimations: true, hideImages: true },
    keyboard: { highlightLinks: true, pageStructure: true, bigCursor: true },
    cognitive: { stopAnimations: true, focusRead: true, readingGuide: true }
  };

  function applyProfile(profileKey) {
    if (profileKey === 'standard') { resetAllFeatures(false); savePrefs(); return; }
    if (!profileKey || !PROFILES[profileKey]) return;

    // Reset first
    resetAllFeatures(true);

    var profile = PROFILES[profileKey];

    Object.keys(profile).forEach(function(key) {
      if (key === 'contrast') {
        state.contrast = profile[key];
        applyContrast(profile[key]);
        // Update contrast buttons UI
        var group = viewAccess.querySelector('.axs-contrast-group');
        if (group) {
          group.querySelectorAll('.axs-contrast-btn').forEach(function(btn) {
            var isMatch = btn.textContent.toLowerCase() === profile[key];
            btn.classList.toggle('axs-active', isMatch);
            btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
          });
        }
      } else if (key === 'textSizeBoost') {
        state.textSize = 100 + profile[key];
        document.documentElement.style.fontSize = state.textSize + '%';
        if (textSizeLabel) textSizeLabel.textContent = state.textSize + '%';
      } else {
        state[key] = true;
        // Activate the feature handler
        var handlers = {
          stopAnimations: toggleStopAnimations,
          focusRead: toggleFocusRead,
          readingGuide: toggleReadingGuide,
          bigCursor: toggleBigCursor,
          highlightLinks: toggleHighlightLinks,
          lineHeight: toggleLineHeight,
          dyslexicFont: toggleDyslexicFont,
          pageStructure: togglePageStructure,
          hideImages: toggleHideImages
        };
        if (handlers[key]) handlers[key](true);

        // Update toggle UI
        var toggle = viewAccess.querySelector('[data-feature="' + key + '"] .axs-toggle');
        if (toggle) toggle.classList.add('axs-on');
        var row = viewAccess.querySelector('[data-feature="' + key + '"]');
        if (row) row.setAttribute('aria-checked', 'true');
      }
    });

    savePrefs();
  }

  // ═══════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════
  function addBotMessage(text) {
    chatMessages.push({ role: 'bot', text: text });
    renderChatMessage('bot', text);
  }

  function addUserMessage(text) {
    chatMessages.push({ role: 'user', text: text });
    renderChatMessage('user', text);
  }

  function simpleMarkdown(text) {
    // Sanitize HTML entities first
    var html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="axs-msg__link">$1</a>');
    // Bullet lists: lines starting with - or *
    html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function renderChatMessage(role, text) {
    var msg = el('div', { className: 'axs-msg axs-msg--' + role });

    var avatarEl = el('div', { className: 'axs-msg__avatar' });
    avatarEl.innerHTML = role === 'bot' ? ICONS.treize : ICONS.user;

    var bubble = el('div', {
      className: 'axs-msg__bubble',
      role: 'article',
      'aria-label': (role === 'bot' ? 'Treize says: ' : 'You said: ') + text
    });
    if (role === 'bot') {
      bubble.innerHTML = simpleMarkdown(text);
    } else {
      bubble.textContent = text;
    }

    msg.appendChild(avatarEl);
    msg.appendChild(bubble);
    chatMessagesContainer.appendChild(msg);
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function showChatLoading() {
    chatLoading = true;
    var msg = el('div', { className: 'axs-msg axs-msg--bot', id: 'axs-chat-loading' });
    var avatarEl = el('div', { className: 'axs-msg__avatar' });
    avatarEl.innerHTML = ICONS.treize;
    var bubble = el('div', { className: 'axs-msg__bubble' });
    var dots = el('div', { className: 'axs-msg__loading' });
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
    msg.appendChild(avatarEl);
    msg.appendChild(bubble);
    chatMessagesContainer.appendChild(msg);
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function removeChatLoading() {
    chatLoading = false;
    var loader = document.getElementById('axs-chat-loading');
    if (loader) loader.remove();
  }

  function sendChatMessage(text) {
    if (chatLoading) return;

    addUserMessage(text);
    chatInput.value = '';

    // Hide chips after first message
    if (chipsContainer) chipsContainer.style.display = 'none';

    showChatLoading();

    var sessionId = getSessionId();
    var history = chatMessages.map(function(m) {
      return { role: m.role === 'bot' ? 'assistant' : 'user', content: m.text };
    });

    fetch(AXS_API + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message: text,
        page_url: window.location.href,
        history: history.slice(-10) // Last 10 messages for context
      })
    })
    .then(function(r) {
      if (!r.ok) throw new Error('API error');
      return r.json();
    })
    .then(function(data) {
      removeChatLoading();
      if (data.reply) {
        addBotMessage(data.reply);
      } else {
        addBotMessage("I'm experiencing a temporary issue. Please try again shortly.");
      }
    })
    .catch(function() {
      removeChatLoading();
      addBotMessage("I'm experiencing a temporary issue. Please try again shortly.");
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════
  function resetAllFeatures(skipSave) {
    // Visual
    toggleDarkMode(false);
    applyContrast('off');
    toggleGreyscale(false);

    // Reading
    document.documentElement.style.fontSize = '';
    toggleLineHeight(false);
    toggleDyslexicFont(false);
    toggleFocusRead(false);
    toggleReadingGuide(false);
    closeRSVP();

    // Audio
    stopReadPage();
    toggleTTS(false);
    stopVoiceNav();

    // Navigation
    toggleStopAnimations(false);
    toggleHideImages(false);
    toggleBigCursor(false);
    toggleHighlightLinks(false);
    if (structurePanel.classList.contains('axs-visible')) {
      structurePanel.classList.remove('axs-visible');
    }

    // Restore simplified content
    originalTexts.forEach(function(html, el) {
      el.innerHTML = html;
    });
    originalTexts.clear();

    // Hide AI card
    hideAICard();

    // Reset all toggles in UI
    viewAccess.querySelectorAll('.axs-toggle').forEach(function(t) {
      t.classList.remove('axs-on');
    });
    viewAccess.querySelectorAll('.axs-feature[role="switch"]').forEach(function(f) {
      f.setAttribute('aria-checked', 'false');
    });

    // Reset contrast buttons
    var contrastBtns = viewAccess.querySelectorAll('.axs-contrast-btn');
    contrastBtns.forEach(function(btn, i) {
      btn.classList.toggle('axs-active', i === 0);
      btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
    });

    // Reset text size label
    if (textSizeLabel) textSizeLabel.textContent = '100%';

    // Reset profile dropdown
    if (profileSelect) profileSelect.value = '';

    // Clear state
    state = {};
    if (!skipSave) savePrefs();
  }

  function resetAll() {
    resetAllFeatures(false);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESTORE SAVED PREFERENCES
  // ═══════════════════════════════════════════════════════════════
  function restorePrefs() {
    if (state.darkMode) toggleDarkMode(true);
    if (state.contrast && state.contrast !== 'off') {
      applyContrast(state.contrast);
      var group = viewAccess.querySelector('.axs-contrast-group');
      if (group) {
        group.querySelectorAll('.axs-contrast-btn').forEach(function(btn) {
          var isMatch = btn.textContent.toLowerCase() === state.contrast;
          btn.classList.toggle('axs-active', isMatch);
          btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
        });
      }
    }
    if (state.greyscale) toggleGreyscale(true);
    if (state.textSize && state.textSize !== 100) {
      document.documentElement.style.fontSize = state.textSize + '%';
      if (textSizeLabel) textSizeLabel.textContent = state.textSize + '%';
    }
    if (state.lineHeight) toggleLineHeight(true);
    if (state.dyslexicFont) toggleDyslexicFont(true);
    if (state.focusRead) toggleFocusRead(true);
    if (state.readingGuide) toggleReadingGuide(true);
    if (state.stopAnimations) toggleStopAnimations(true);
    if (state.hideImages) toggleHideImages(true);
    if (state.bigCursor) toggleBigCursor(true);
    if (state.highlightLinks) toggleHighlightLinks(true);
  }

  // ═══════════════════════════════════════════════════════════════
  // KEYBOARD EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════
  function handleKeydown(e) {
    // Esc closes panel
    if (e.key === 'Escape') {
      if (rsvpOverlay.classList.contains('axs-visible')) {
        closeRSVP();
        return;
      }
      if (structurePanel.classList.contains('axs-visible')) {
        togglePageStructure(false);
        return;
      }
      if (panelOpen) {
        closePanel();
        return;
      }
    }

    // Focus trap when panel is open
    if (panelOpen) {
      handleFocusTrap(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════════
  // GOOGLE TRANSLATE INTEGRATION
  // ═══════════════════════════════════════════════════════════════
  function loadGoogleTranslate() {
    // Inject hidden Google Translate element
    var gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(gtDiv);

    // Load Google Translate script
    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.body.appendChild(s);
  }

  function triggerGoogleTranslate(langCode) {
    // Find the Google Translate hidden select element and change its value
    var gtSelect = document.querySelector('#google_translate_element select.goog-te-combo');
    if (gtSelect) {
      gtSelect.value = langCode;
      gtSelect.dispatchEvent(new Event('change'));
      return true;
    }
    return false;
  }

  function translatePage(langCode) {
    if (!langCode) {
      // Restore to English — use Google Translate's own combo box
      if (triggerGoogleTranslate('')) {
        return; // GT handles the restore internally
      }
      // Fallback: clear cookies and reload
      var domains = ['', location.hostname, '.' + location.hostname];
      var parts = location.hostname.split('.');
      if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
      domains.forEach(function(d) {
        var domainStr = d ? '; domain=' + d : '';
        document.cookie = 'googtrans=; path=/' + domainStr + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      });
      location.reload();
      return;
    }
    // Translate to selected language via Google Translate combo box
    if (triggerGoogleTranslate(langCode)) {
      return; // GT handles it
    }
    // Fallback: set cookie and reload
    var domains = ['', location.hostname, '.' + location.hostname];
    var parts = location.hostname.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    domains.forEach(function(d) {
      var domainStr = d ? '; domain=' + d : '';
      document.cookie = 'googtrans=/en/' + langCode + '; path=/' + domainStr;
    });
    location.reload();
  }

  // ═══════════════════════════════════════════════════════════════
  function init() {
    buildWidget();
    restorePrefs();
    document.addEventListener('keydown', handleKeydown);
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
