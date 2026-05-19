// @ts-check

import { Component } from '@theme/component';

/**
 * @typedef {{ name: string, risk_joint: number, risk_gut: number, risk_skin: number, risk_anxiety: number }} BreedRecord
 *
 * @typedef {{
 *   field: string,
 *   operator: '==' | '>' | '<' | '>=' | '<=' | 'contains',
 *   value: string | number,
 *   output: string,
 *   points: number
 * }} ScoringRule
 *
 * @typedef {{
 *   outputs: string[],
 *   threshold: number,
 *   rules: ScoringRule[],
 *   breedRules?: {
 *     breedField: string,
 *     riskMap: Record<string, { output: string, multiplier: number }>
 *   }
 * }} ScoringConfig
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   screens: string[],
 *   autoAdvance: string[],
 *   progressScreens: string[],
 *   answerKeys: Record<string, string>,
 *   personalization: Record<string, string>,
 *   breeds: BreedRecord[],
 *   breedsRef?: string,
 *   scoring: ScoringConfig,
 *   products: Record<string, { handle: string, rationale: string }>
 * }} QuizConfig
 */

// ── Generic scoring engine ────────────────────────────

/**
 * @param {ScoringRule} rule
 * @param {Record<string, any>} answers
 * @returns {boolean}
 */
function evalRule(rule, answers) {
  const actual = answers[rule.field];
  if (actual === undefined || actual === null) return false;
  switch (rule.operator) {
    case '==': return actual == rule.value;
    case '>':  return Number(actual) >  Number(rule.value);
    case '<':  return Number(actual) <  Number(rule.value);
    case '>=': return Number(actual) >= Number(rule.value);
    case '<=': return Number(actual) <= Number(rule.value);
    case 'contains': return Array.isArray(actual) ? actual.includes(rule.value) : actual == rule.value;
    default:   return false;
  }
}

/**
 * @param {Record<string, any>} answers
 * @param {ScoringConfig} config
 * @param {BreedRecord[]} breeds
 * @returns {Record<string, number>}
 */
export function computeScoresFromConfig(answers, config, breeds) {
  /** @type {Record<string, number>} */
  const scores = Object.fromEntries(config.outputs.map(o => [o, 0]));

  if (config.breedRules) {
    const { breedField, riskMap } = config.breedRules;
    const breedName = answers[breedField];
    const breed = breeds.find(b => b.name === breedName);
    if (breed) {
      for (const [riskKey, mapping] of Object.entries(riskMap)) {
        const riskValue = /** @type {any} */ (breed)[riskKey] ?? 0;
        if (mapping.output in scores) {
          scores[mapping.output] = (scores[mapping.output] ?? 0) + riskValue * mapping.multiplier;
        }
      }
    }
  }

  for (const rule of config.rules) {
    if (evalRule(rule, answers) && rule.output in scores) {
      scores[rule.output] = (scores[rule.output] ?? 0) + rule.points;
    }
  }

  return scores;
}

/**
 * @param {Record<string, number>} scores
 * @param {number} threshold
 * @returns {string | null}
 */
export function topScoringOutput(scores, threshold) {
  const entries = Object.entries(scores).filter(([, v]) => v >= threshold);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

/**
 * @param {Record<string, any>} answers
 * @param {string | null} targeted
 * @param {BreedRecord[]} breeds
 * @returns {{ p1: string, p2: string, p3: string }}
 */
export function buildHealthSummary(answers, targeted, breeds) {
  const name = String(answers['dog_name'] || 'Your dog');
  const breed = String(answers['dog_breed'] || '');
  const age = Number(answers['dog_age_years']);
  const weight = Number(answers['dog_weight']);
  const digestion = String(answers['dog_digestion'] || '');
  const skin = String(answers['dog_skin'] || '');
  const stress = String(answers['dog_stress'] || '');
  const joints = String(answers['dog_joints'] || '');
  const energy = String(answers['dog_energy'] || '');

  // Para 1 — profile snapshot
  const ageLabel = isNaN(age) ? '' : age < 1 ? 'a puppy' : age <= 3 ? 'a young' : age <= 7 ? 'an adult' : 'a senior';
  const showBreed = breed && breed !== 'Mixed breed' && breed !== 'Not sure';
  const profileParts = [ageLabel, showBreed ? breed : ''].filter(Boolean).join(' ');
  const weightPart = !isNaN(weight) && weight > 0 ? `, weighing ${weight} kg` : '';
  const p1 = profileParts
    ? `${name} is ${profileParts}${weightPart}.`
    : `${name} is your dog${weightPart}.`;

  // Para 2 — observed signals
  /** @type {string[]} */
  const signals = [];
  if (digestion === 'sensitive') signals.push('some digestive sensitivity');
  else if (digestion === 'flatulence') signals.push('digestive discomfort and gas');
  if (skin === 'dull') signals.push('a dull or dry coat');
  else if (skin === 'dermatitis') signals.push('skin or ear irritation');
  if (stress === 'anxious') signals.push('signs of anxiety or reactivity');
  else if (stress === 'sometimes') signals.push('occasional stress');
  if (joints === 'stiffness') signals.push('some joint stiffness');
  else if (joints === 'diagnosed') signals.push('a diagnosed joint condition');
  if (energy === 'very_high') signals.push('very high energy that can be hard to settle');

  let p2 = '';
  if (signals.length === 0) {
    p2 = `Everything looks broadly healthy across the areas we checked — great news for ${name}.`;
  } else if (signals.length === 1) {
    p2 = `Based on your answers, we understand ${name} shows ${signals[0]}.`;
  } else {
    const last = signals.pop();
    p2 = `Based on your answers, we understand ${name} shows ${signals.join(', ')} and ${last}.`;
  }

  // Para 3 — recommendation bridge
  const breedRecord = breeds.find(b => b.name === breed);
  const breedRiskJoint = breedRecord ? breedRecord.risk_joint : 0;
  const ageNote = !isNaN(age) && age > 7 ? `${name}'s age` : '';
  const breedNote = breedRiskJoint >= 4 && showBreed ? `${breed}s being prone to joint issues` : '';
  const mobilityContext = [ageNote, breedNote].filter(Boolean).join(' and ');

  const essentialDesc = 'a brief description of what it does (to be updated)';
  const item = (/** @type {string} */ text) => `<span class="quiz-summary-item">${text}</span>`;
  const essentialItem = item(`Broono Essential as a daily foundation — ${essentialDesc}`);
  let p3 = '';
  if (targeted === 'mobility') {
    const reason = mobilityContext ? `, taking into account ${mobilityContext}` : '';
    p3 = `Based on ${name}'s profile${reason}, we're recommending:${essentialItem}${item('Mobility Complex to support comfortable movement and long-term joint health.')}`;
  } else if (targeted === 'prebiotics') {
    p3 = `Based on ${name}'s profile, we're recommending:${essentialItem}${item('Prebiotics Complex to support a healthy gut, resilient digestion, and a thriving coat.')}`;
  } else if (targeted === 'relax') {
    p3 = `Based on ${name}'s profile, we're recommending:${essentialItem}${item(`Relax Complex to help ${name} stay calm, settled, and balanced day to day.`)}`;
  } else {
    p3 = `Based on ${name}'s profile, we're recommending:${essentialItem}`;
  }

  return { p1, p2, p3 };
}

/**
 * @param {Record<string, any>} answers
 * @param {ScoringConfig} config
 * @returns {{ rule: ScoringRule, active: boolean, points: number }[]}
 */
export function ruleContributions(answers, config) {
  return config.rules.map(rule => {
    const active = evalRule(rule, answers);
    return { rule, active, points: active ? rule.points : 0 };
  });
}

/**
 * @param {Record<string, any>} answers
 * @param {ScoringConfig} config
 * @param {BreedRecord[]} breeds
 * @returns {{ output: string, points: number }[]}
 */
export function breedContributions(answers, config, breeds) {
  if (!config.breedRules) return [];
  const { breedField, riskMap } = config.breedRules;
  const breed = breeds.find(b => b.name === answers[breedField]);
  if (!breed) return [];
  return Object.entries(riskMap).map(([riskKey, mapping]) => ({
    output: mapping.output,
    points: (/** @type {any} */ (breed)[riskKey] ?? 0) * mapping.multiplier,
  }));
}

// ── Component ─────────────────────────────────────────

class CustomQuizComponent extends Component {
  /** @type {number} */
  #currentIndex = 0;

  /** @type {Record<string, any>} */
  #answers = {};

  /** @type {string[]} */
  #filteredBreeds = [];

  /** @type {number} */
  #breedFocusIndex = -1;

  /** @type {boolean} */
  #emailSubmitted = false;

  /** @type {QuizConfig | null} */
  #quizConfig = null;

  /** @type {Record<string, { title: string, url: string, image: string }>} */
  #productLookup = {};

  /** @type {{ klaviyoListId: string, appsScriptUrl: string }} */
  #runtimeConfig = { klaviyoListId: '', appsScriptUrl: '' };

  #vpResizeHandler = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    const keyboardOpen = vv.height < window.innerHeight * 0.8;
    const wasOpen = this.classList.contains('keyboard-open');
    this.classList.toggle('keyboard-open', keyboardOpen);
    this.style.setProperty('--vv-height', keyboardOpen ? `${vv.height}px` : '');
    if (keyboardOpen && !wasOpen) this.scrollTop = 0;
  };

  async connectedCallback() {
    super.connectedCallback();

    const runtimeEl = document.getElementById('quiz-config');
    this.#runtimeConfig = JSON.parse(runtimeEl?.textContent ?? '{}');

    this.#productLookup = JSON.parse(document.getElementById('quiz-product-lookup')?.textContent ?? '{}');

    const configUrl = this.#runtimeConfig.configUrl ?? '';
    if (configUrl) {
      try {
        const res = await fetch(configUrl);
        this.#quizConfig = await res.json();
        const cfg = this.#quizConfig;
        const breedsRef = cfg?.breedsRef;
        if (breedsRef && cfg) {
          const base = configUrl.substring(0, configUrl.lastIndexOf('/') + 1);
          const breedsRes = await fetch(base + breedsRef);
          cfg.breeds = await breedsRes.json();
        }
        this.#filteredBreeds = (this.#quizConfig?.breeds ?? []).map(/** @param {BreedRecord} b */ b => b.name);
      } catch (err) {
        console.error('[quiz] Failed to load config:', err);
      }
    }

    document.addEventListener('click', this.#handleOutsideClick);
    window.visualViewport?.addEventListener('resize', this.#vpResizeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#handleOutsideClick);
    window.visualViewport?.removeEventListener('resize', this.#vpResizeHandler);
  }

  /** @returns {QuizConfig} */
  get #cfg() {
    if (!this.#quizConfig) throw new Error('[quiz] Config not loaded');
    return this.#quizConfig;
  }

  /**
   * @param {string} key
   * @returns {{ title: string, url: string, image: string, rationale: string } | null}
   */
  #mergeProductData(key) {
    const cfgProduct = this.#cfg.products[key];
    if (!cfgProduct) return null;
    const resolved = this.#productLookup[cfgProduct.handle];
    if (!resolved) return null;
    return { ...resolved, rationale: cfgProduct.rationale };
  }

  // ── Navigation ────────────────────────────────────────

  startQuiz() { this.#goToIndex(1); }

  advance() {
    const allScreens = Array.from(this.querySelectorAll('.quiz-screen'));
    const cfgScreens = this.#cfg.screens;
    const currentName = /** @type {HTMLElement} */ (allScreens[this.#currentIndex])?.dataset.screen ?? '';
    const cfgIdx = cfgScreens.indexOf(currentName);
    const nextName = cfgScreens[cfgIdx + 1];
    if (!nextName) return;
    const nextDomIdx = allScreens.findIndex(s => /** @type {HTMLElement} */ (s).dataset.screen === nextName);
    if (nextDomIdx >= 0) this.#goToIndex(nextDomIdx);
  }

  goBack() {
    if (this.#currentIndex === 0) return;
    const allScreens = Array.from(this.querySelectorAll('.quiz-screen'));
    const cfgScreens = this.#cfg.screens;
    const currentName = /** @type {HTMLElement} */ (allScreens[this.#currentIndex])?.dataset.screen ?? '';
    const cfgIdx = cfgScreens.indexOf(currentName);
    if (cfgIdx <= 1) { this.#goToIndex(0, true); return; }
    const prevName = cfgScreens[cfgIdx - 1];
    const prevDomIdx = allScreens.findIndex(s => /** @type {HTMLElement} */ (s).dataset.screen === prevName);
    if (prevDomIdx >= 0) this.#goToIndex(prevDomIdx, true);
  }

  /** @param {number} nextIndex @param {boolean} [backwards] */
  #goToIndex(nextIndex, backwards = false) {
    const screens = this.querySelectorAll('.quiz-screen');
    const current = screens[this.#currentIndex];
    const next = screens[nextIndex];
    if (!next) return;

    current?.classList.remove('is-active');
    next.classList.add('is-active');
    next.classList.add(backwards ? 'slide-in-right' : 'slide-in-left');
    next.addEventListener('animationend', () => next.classList.remove('slide-in-left', 'slide-in-right'), { once: true });

    this.#currentIndex = nextIndex;
    this.#updateProgress();

    const screenName = /** @type {HTMLElement} */ (next).dataset.screen ?? '';
    this.#personaliseScreen();

    this.querySelectorAll('.quiz-back').forEach(btn => btn.classList.add('quiz-hidden'));
    if (nextIndex > 0) {
      const activeBack = /** @type {HTMLElement|null} */ (next.querySelector('.quiz-back'));
      if (activeBack) activeBack.classList.remove('quiz-hidden');
    }

    this.className = this.className.replace(/\bscreen-\S+/g, '').trim();
    if (screenName) this.classList.add(`screen-${screenName}`);

    if (screenName === 'q1' && this.refs.nameInput instanceof HTMLElement) {
      this.refs.nameInput.focus();
      setTimeout(() => (this.refs.q1Next instanceof HTMLElement) && this.refs.q1Next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
    }
    if (screenName === 'q4' && this.refs.ageInput instanceof HTMLElement) {
      this.refs.ageInput.focus();
      setTimeout(() => (this.refs.q4Next instanceof HTMLElement) && this.refs.q4Next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
    }
    if (screenName === 'q2' && this.refs.breedSearch instanceof HTMLElement) {
      this.refs.breedSearch.focus();
      setTimeout(() => (this.refs.q2Next instanceof HTMLElement) && this.refs.q2Next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
    }
    if (screenName === 'email' && this.refs.emailInput instanceof HTMLElement) {
      this.refs.emailInput.focus();
      setTimeout(() => (this.refs.emailSubmitBtn instanceof HTMLElement) && this.refs.emailSubmitBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
    }
    if (screenName === 'results') this.#renderResults();
  }

  #updateProgress() {
    const progressScreens = this.#cfg.progressScreens;
    const allDomScreens = this.querySelectorAll('.quiz-screen');
    const screenName = /** @type {HTMLElement} */ (allDomScreens[this.#currentIndex])?.dataset.screen ?? '';
    const pos = progressScreens.indexOf(screenName);
    const pct = pos < 0 ? 0 : Math.round(((pos + 1) / progressScreens.length) * 100);
    const bar = this.refs.progressBar;
    const inner = this.refs.progressBarInner;
    if (bar instanceof Element) bar.setAttribute('aria-valuenow', String(pos < 0 ? 0 : pos + 1));
    if (inner instanceof HTMLElement) inner.style.width = pct + '%';
  }

  #personaliseScreen() {
    const name = /** @type {string | undefined} */ (this.#answers['dog_name']) ?? 'your dog';
    const personalization = this.#cfg.personalization;
    for (const [key, template] of Object.entries(personalization)) {
      const text = template.replace(/\{name\}/g, name);
      const el = this.querySelector(`[data-ref="${key}"]`);
      if (el instanceof Element) el.innerHTML = text.replace(/\[([^\]]+)\]/g, '<span class="quiz-highlight">$1</span>');
    }
  }

  // ── Input handlers ────────────────────────────────────

  /** @param {Event} e */
  onNameInput(e) {
    const val = /** @type {HTMLInputElement} */ (e.target).value.trim();
    this.#answers['dog_name'] = val || undefined;
    const btn = this.refs.q1Next;
    if (btn instanceof HTMLButtonElement) btn.disabled = !val;
  }

  /** @param {KeyboardEvent} e */
  onInputKeydown(e) {
    if (e.key === 'Enter') this.advance();
  }

  /** @param {Event} e */
  onAgeInput(e) {
    const val = parseFloat(/** @type {HTMLInputElement} */ (e.target).value);
    this.#answers['dog_age_years'] = isNaN(val) ? undefined : val;
    const btn = this.refs.q4Next;
    if (btn instanceof HTMLButtonElement) btn.disabled = isNaN(val) || val < 0;
  }

  // ── Card selection ────────────────────────────────────

  /** @param {Event} e */
  selectCard(e) {
    const card = /** @type {HTMLElement} */ (e.target).closest('.quiz-card');
    if (!(card instanceof HTMLElement)) return;
    const question = card.dataset.question ?? '';
    const value = card.dataset.value ?? '';

    this.querySelectorAll(`.quiz-card[data-question="${question}"]`).forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');

    const key = this.#cfg.answerKeys[question];
    if (key) this.#answers[key] = value;

    const autoAdvance = new Set(this.#cfg.autoAdvance);
    if (autoAdvance.has(question)) setTimeout(() => this.advance(), 220);
  }

  // ── Breed dropdown ────────────────────────────────────

  openBreedDropdown() {
    this.#renderBreedOptions(this.#filteredBreeds);
    const dd = this.refs.breedDropdown;
    if (dd instanceof Element) dd.classList.add('is-open');
    const bs = this.refs.breedSearch;
    if (bs instanceof Element) bs.setAttribute('aria-expanded', 'true');
  }

  /** @param {Event} e */
  onBreedInput(e) {
    const query = /** @type {HTMLInputElement} */ (e.target).value.toLowerCase();
    const allNames = (this.#quizConfig?.breeds ?? []).map(b => b.name);
    this.#filteredBreeds = allNames.filter(n => n.toLowerCase().includes(query));
    this.#breedFocusIndex = -1;
    this.#renderBreedOptions(this.#filteredBreeds);
    const dd2 = this.refs.breedDropdown;
    if (dd2 instanceof Element) dd2.classList.add('is-open');
    this.#answers['dog_breed'] = undefined;
    const btn = this.refs.q2Next;
    if (btn instanceof HTMLButtonElement) btn.disabled = true;
  }

  /** @param {KeyboardEvent} e */
  onBreedKeydown(e) {
    const dropdown = this.refs.breedDropdown instanceof Element ? this.refs.breedDropdown : null;
    const options = /** @type {NodeListOf<Element>} */ (dropdown?.querySelectorAll('.quiz-breed-option') ?? document.querySelectorAll('.quiz-breed-option-none'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.#breedFocusIndex = Math.min(this.#breedFocusIndex + 1, options.length - 1);
      this.#highlightBreedOption(options);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.#breedFocusIndex = Math.max(this.#breedFocusIndex - 1, 0);
      this.#highlightBreedOption(options);
    } else if (e.key === 'Enter' && this.#breedFocusIndex >= 0) {
      e.preventDefault();
      const focused = options[this.#breedFocusIndex];
      if (focused instanceof HTMLElement) this.#selectBreed(focused.dataset.breed ?? '');
    } else if (e.key === 'Escape') {
      dropdown?.classList.remove('is-open');
    }
  }

  /** @param {NodeListOf<Element>} options */
  #highlightBreedOption(options) {
    options.forEach((o, i) => o.classList.toggle('is-focused', i === this.#breedFocusIndex));
    options[this.#breedFocusIndex]?.scrollIntoView({ block: 'nearest' });
  }

  /** @param {string[]} names */
  #renderBreedOptions(names) {
    const dropdown = this.refs.breedDropdown;
    if (!(dropdown instanceof HTMLElement)) return;
    dropdown.innerHTML = names.map(n =>
      `<div class="quiz-breed-option" data-breed="${n}" role="option" tabindex="-1">${n}</div>`
    ).join('');
    dropdown.querySelectorAll('.quiz-breed-option').forEach(opt => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.#selectBreed(/** @type {HTMLElement} */ (opt).dataset.breed ?? '');
      });
    });
  }

  /** @param {string} name */
  #selectBreed(name) {
    this.#answers['dog_breed'] = name;
    const searchInput = this.refs.breedSearch;
    if (searchInput instanceof HTMLInputElement) searchInput.value = name;
    const dd3 = this.refs.breedDropdown;
    if (dd3 instanceof Element) dd3.classList.remove('is-open');
    const btn = this.refs.q2Next;
    if (btn instanceof HTMLButtonElement) btn.disabled = false;
  }

  #handleOutsideClick = (/** @type {MouseEvent} */ e) => {
    const wrapper = this.querySelector('.quiz-breed-wrapper');
    if (wrapper && !wrapper.contains(/** @type {Node} */ (e.target))) {
      if (this.refs.breedDropdown instanceof Element) this.refs.breedDropdown.classList.remove('is-open');
    }
  };

  // ── Email gate ────────────────────────────────────────

  /** @param {Event} e */
  onEmailInput(e) {
    const val = /** @type {HTMLInputElement} */ (e.target).value.trim();
    const btn = this.refs.emailSubmitBtn;
    if (btn instanceof HTMLButtonElement) btn.disabled = !val.includes('@');
  }

  /** @param {KeyboardEvent} e */
  onEmailKeydown(e) {
    if (e.key === 'Enter') this.submitEmail();
  }

  submitEmail() {
    const emailInput = this.refs.emailInput;
    const consentCheckbox = this.refs.consentCheckbox;
    if (!(emailInput instanceof HTMLInputElement)) return;
    const email = emailInput.value.trim();
    if (!email.includes('@')) return;
    const consent = consentCheckbox instanceof HTMLInputElement ? consentCheckbox.checked : false;

    this.#emailSubmitted = true;

    if (/** @type {any} */ (window).klaviyo) {
      /** @type {any} */ (window).klaviyo.identify({
        $email: email,
        dog_name: this.#answers['dog_name'],
        dog_breed: this.#answers['dog_breed'],
        dog_age_years: this.#answers['dog_age_years'],
        dog_aspiration: this.#answers['dog_aspiration'],
        $consent: consent ? ['email'] : [],
      });
    }

    this.advance();
  }

  skipEmail() { this.advance(); }

  // ── Results ───────────────────────────────────────────

  #renderResults() {
    const cfg = this.#cfg;
    const breeds = cfg.breeds;
    const scores = computeScoresFromConfig(this.#answers, cfg.scoring, breeds);
    const targeted = topScoringOutput(scores, cfg.scoring.threshold);

    const subtitle = this.querySelector('[data-ref="resultsSubtitle"]');
    if (subtitle instanceof Element) {
      /** @type {Record<string, string>} */
      const labels = { mobility: 'joint support', prebiotics: 'digestive & coat health', relax: 'calm & balance' };
      subtitle.textContent = targeted
        ? `Daily resilience + ${labels[targeted] ?? targeted}`
        : 'Daily resilience foundation';
    }

    const container = this.refs.productCardsContainer;
    if (!(container instanceof Element)) return;

    const name = /** @type {string | undefined} */ (this.#answers['dog_name']) ?? 'your dog';

    const summaryEl = this.querySelector('[data-ref="resultsSummary"]');
    if (summaryEl instanceof Element) {
      const s = buildHealthSummary(this.#answers, targeted, breeds);
      summaryEl.innerHTML = `<p>${s.p1}</p><p>${s.p2}</p><p>${s.p3}</p>`;
    }

    const cards = [this.#buildProductCard('essential', name)];
    if (targeted) cards.push(this.#buildProductCard(targeted, name));
    container.innerHTML = cards.join('');

    if (this.#emailSubmitted && /** @type {any} */ (window).klaviyo) {
      /** @type {any} */ (window).klaviyo.track('Quiz Completed', {
        ...this.#answers,
        foundation_product: 'essential',
        targeted_product: targeted,
        ...Object.fromEntries(cfg.scoring.outputs.map(o => [`${o}_score`, scores[o]])),
      });
    }

    const appsScriptUrl = this.#runtimeConfig.appsScriptUrl;
    if (appsScriptUrl) {
      fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.#answers,
          ...Object.fromEntries(cfg.scoring.outputs.map(o => [`${o}_score`, scores[o]])),
          foundation_product: 'essential',
          targeted_product: targeted,
          submitted_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  /**
   * @param {string} key
   * @param {string} dogName
   * @returns {string}
   */
  #buildProductCard(key, dogName) {
    const product = this.#mergeProductData(key);
    if (!product) return '';
    return `
      <div class="quiz-product-card">
        ${product.image ? `<img src="${product.image}" alt="${product.title}" loading="lazy" />` : ''}
        <div class="quiz-product-card__body">
          <p class="quiz-product-card__name">${product.title ?? ''}</p>
          <p class="quiz-product-card__rationale">${product.rationale ?? ''}</p>
          <a href="${product.url ?? '#'}" class="quiz-product-card__cta">Add to ${dogName}'s routine</a>
        </div>
      </div>
    `;
  }
}

customElements.define('custom-quiz-component', CustomQuizComponent);
