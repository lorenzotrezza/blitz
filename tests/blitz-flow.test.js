const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createCanvasContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    fillRect() {},
    clearRect() {},
    fillText() {},
    strokeRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
  };
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  _setFromString(value) {
    this.element._classes = new Set(String(value || '').split(/\s+/).filter(Boolean));
  }

  _sync() {
    this.element._className = Array.from(this.element._classes).join(' ');
  }

  add(...tokens) {
    tokens.forEach((token) => this.element._classes.add(token));
    this._sync();
  }

  remove(...tokens) {
    tokens.forEach((token) => this.element._classes.delete(token));
    this._sync();
  }

  toggle(token, force) {
    if (force === true) {
      this.add(token);
      return true;
    }
    if (force === false) {
      this.remove(token);
      return false;
    }
    if (this.contains(token)) {
      this.remove(token);
      return false;
    }
    this.add(token);
    return true;
  }

  contains(token) {
    return this.element._classes.has(token);
  }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.style = {};
    this.dataset = {};
    this.disabled = false;
    this.textContent = '';
    this.value = '';
    this._innerHTML = '';
    this._className = '';
    this._classes = new Set();
    this.listeners = {};
    this.width = 420;
    this.height = 520;
    this.offsetWidth = 420;
    this.classList = new FakeClassList(this);
  }

  get className() {
    return this._className;
  }

  set className(value) {
    this._className = String(value || '');
    this.classList._setFromString(this._className);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value || '');
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  querySelectorAll(selector) {
    if (selector !== '.car-dot') return [];
    const matches = [];
    const re = /class="([^"]*\bcar-dot\b[^"]*)"[^>]*data-index="(\d+)"/g;
    let match;
    while ((match = re.exec(this._innerHTML))) {
      const el = new FakeElement();
      el.className = match[1];
      el.dataset.index = match[2];
      matches.push(el);
    }
    return matches;
  }

  getContext() {
    return createCanvasContext();
  }
}

function createTimerHarness() {
  let now = 0;
  let nextId = 1;
  const queue = [];

  function setTimeoutFake(fn, delay = 0) {
    const entry = {
      id: nextId++,
      time: now + Number(delay || 0),
      fn,
      cleared: false,
    };
    queue.push(entry);
    return entry.id;
  }

  function clearTimeoutFake(id) {
    const entry = queue.find((item) => item.id === id);
    if (entry) entry.cleared = true;
  }

  function advance(ms) {
    const target = now + ms;
    while (true) {
      let next = null;
      for (const item of queue) {
        if (item.cleared || item.time > target) continue;
        if (!next || item.time < next.time) next = item;
      }
      if (!next) break;
      next.cleared = true;
      now = next.time;
      next.fn();
    }
    now = target;
  }

  return {
    advance,
    setTimeoutFake,
    clearTimeoutFake,
    now: () => now,
  };
}

function loadGame() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(scriptMatch, 'inline game script not found');
  const script = scriptMatch[1];

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const elements = new Map();
  ids.forEach((id) => elements.set(id, new FakeElement(id)));

  for (const id of ids) {
    if (id.startsWith('screen-')) {
      elements.get(id).className = 'screen';
    }
  }

  const timers = createTimerHarness();
  const documentListeners = {};
  const location = {
    href: 'http://localhost/',
    search: '',
  };

  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    querySelectorAll(selector) {
      if (selector === '.screen') {
        return ids.filter((id) => id.startsWith('screen-')).map((id) => elements.get(id));
      }
      return [];
    },
    addEventListener(type, handler) {
      if (!documentListeners[type]) documentListeners[type] = [];
      documentListeners[type].push(handler);
    },
  };

  const context = {
    console,
    document,
    window: {
      innerWidth: 1280,
      innerHeight: 720,
      location,
      top: {
        location,
      },
    },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
      },
    },
    alert() {},
    setTimeout: timers.setTimeoutFake,
    clearTimeout: timers.clearTimeoutFake,
    requestAnimationFrame(fn) {
      return timers.setTimeoutFake(() => fn(timers.now()), 16);
    },
    cancelAnimationFrame: timers.clearTimeoutFake,
    Date: { now: timers.now },
    Math,
    JSON,
    URLSearchParams,
  };

  vm.createContext(context);
  vm.runInContext(script, context);

  return {
    context,
    elements,
    advance: timers.advance,
  };
}

test('showScreen("lights") starts the traffic light sequence', () => {
  const game = loadGame();

  game.context.showScreen('lights');
  assert.equal(game.context.LG.state, 'sequence');

  game.advance(600);
  assert.equal(game.elements.get('l0').classList.contains('on'), true);
});

test('showScreen("race") initializes the race loop state', () => {
  const game = loadGame();

  game.context.showScreen('race');

  assert.equal(game.context.RG.running, true);
  assert.equal(game.context.RG.speed, 0);
  assert.ok(game.context.RG.canvas);
});

test('showScreen("penalty") resets the penalty minigame', () => {
  const game = loadGame();
  game.context.PG.shots = 2;
  game.context.PG.goals = 2;

  game.context.showScreen('penalty');

  assert.equal(game.context.PG.shots, 0);
  assert.equal(game.context.PG.goals, 0);
  assert.equal(game.elements.get('pen-score').textContent, 'GOL: 0 / 3');
});

test('car selection explains the gifted lap count with a track reality note', () => {
  const game = loadGame();

  game.context.showScreen('cars');

  assert.equal(game.elements.get('car-laps').textContent, 'REGALO: 2 GIRI');
  assert.match(game.elements.get('car-laps-real').textContent, /pista vera/i);

  game.context.moveCarSlide(4);

  assert.equal(game.elements.get('car-laps').textContent, 'REGALO: 1 GIRO');
  assert.match(game.elements.get('car-laps-real').textContent, /V12/i);
});

test('result screen states the actual gift voucher for the selected car', () => {
  const game = loadGame();

  game.context.showScreen('cars');
  game.context.moveCarSlide(4);
  game.context.chooseCurrentCar();
  game.context.showScreen('result');

  assert.equal(
    game.elements.get('res-gift-title').textContent,
    '1 GIRO VERI SULLA A.N. GIANNI DE LUCA',
  );
  assert.match(game.elements.get('res-gift-body').textContent, /Voucher non simbolico/i);
  assert.match(game.elements.get('res-gift-body').textContent, /V12/i);
});

test('locked tracks are clickable and backed by ignorant modal copy', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const lockedClickableTracks = [
    ...html.matchAll(/class="track-card locked clickable" data-lock="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.deepEqual(lockedClickableTracks, [
    'monaco',
    'monza',
    'nurburgring',
    'silverstone',
    'suzuka',
    'napoli',
  ]);
  assert.match(html, /id="modal-track-lock"/);
  assert.match(html, /MONACO RESPINGE BLITZ/);
  assert.match(html, /NÜRBURGRING NON HA FIDUCIA/);
});
