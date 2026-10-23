const fs = require('fs');
const path = require('path');

// Setup minimal DOM mocks
const getMockElement = (id) => ({
  id,
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false,
    toggle: () => {}
  },
  innerHTML: '',
  textContent: '',
  className: '',
  addEventListener: () => {},
  appendChild: () => {},
  remove: () => {},
  focus: () => {}
});

const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  beginPath: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  rect: () => {},
  roundRect: () => {},
  arc: () => {},
  moveTo: () => {},
  lineTo: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({ width: 20 }),
  clearRect: () => {},
  strokeRect: () => {},
  fillRect: () => {},
  setLineDash: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  drawImage: () => {}
};

const mockCanvas = {
  width: 1400,
  height: 900,
  getContext: () => mockCtx,
  style: {},
  addEventListener: () => {},
  dispatchEvent: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1400, height: 900 })
};

global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  location: { pathname: '/practice.html', search: '?mode=practice', reload: () => {} }
};

global.document = {
  getElementById: (id) => {
    if (id === 'schematicCanvas' || id === 'cadCanvas') return mockCanvas;
    return getMockElement(id);
  },
  querySelectorAll: () => [],
  createElement: () => getMockElement('dynamic')
};

global.Image = class { constructor() {} };
global.AudioContext = class {
  constructor() { this.destination = {}; }
  createGain() { return { gain: { setValueAtTime: () => {} }, connect: () => {} }; }
  createOscillator() { return { type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
};
global.webkitAudioContext = global.AudioContext;

// Load index.html script
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  throw new Error('Could not find <script> block in index.html');
}

const scriptCode = scriptMatch[1];
eval(scriptCode + `
Object.defineProperty(global, 'components', {
  get() { return components; },
  set(v) { components = v; }
});
Object.defineProperty(global, 'wires', {
  get() { return wires; },
  set(v) { wires = v; }
});
global.loadStarDeltaPractice = loadStarDeltaPractice;
global.starDeltaChecklistDef = starDeltaChecklistDef;
global.updatePracticeChecklist = updatePracticeChecklist;
global.giveNextWireHint = giveNextWireHint;
global.clearOnlyWires = clearOnlyWires;
Object.defineProperty(global, 'activeHint', {
  get() { return activeHint; },
  set(v) { activeHint = v; }
});
`);

console.log('--- TESTING STAR-DELTA PRACTICE LAB ---');

// Test 1: loadStarDeltaPractice() initializes 11 components and 0 wires
loadStarDeltaPractice();
console.log(`Components count: ${components.length} (expected 11)`);
console.log(`Wires count: ${wires.length} (expected 0)`);
if (components.length !== 11 || wires.length !== 0) {
  console.error('FAIL: Components or wires count mismatch in practice mode');
  process.exit(1);
}
console.log('✓ TEST 1 PASSED: Practice mode initialized with 11 components and 0 wires.');

// Test 2: Verify Checklist definition and updatePracticeChecklist()
const totalItems = starDeltaChecklistDef ? starDeltaChecklistDef.reduce((sum, g) => sum + g.items.length, 0) : 0;
if (!starDeltaChecklistDef || totalItems !== 32) {
  console.error(`FAIL: starDeltaChecklistDef total items expected 32, got ${totalItems}`);
  process.exit(1);
}
const initialChecklist = updatePracticeChecklist();
console.log(`Initial checklist connected count: ${initialChecklist.doneCount} / ${initialChecklist.total}`);
if (initialChecklist.doneCount !== 0) {
  console.error('FAIL: Initial connected count should be 0');
  process.exit(1);
}
console.log('✓ TEST 2 PASSED: Checklist has 32 items, all initially unchecked.');

// Test 3: Add wire from Mains L1 to Breaker 1 and check reachability
const feed = components.find(c => c.type === 'FEED_3P');
const qm1 = components.find(c => c.type === 'DISYUNTOR_3P');
wires.push({
  fromId: feed.terminals[0].id,
  toId: qm1.terminals[0].id,
  wireType: 'PHASE_L1',
  color: '#d32f2f'
});

const progressAfterOneWire = updatePracticeChecklist();
console.log(`Progress after 1 wire: ${progressAfterOneWire.doneCount} / ${progressAfterOneWire.total}`);
if (progressAfterOneWire.doneCount !== 1) {
  console.error(`FAIL: Expected 1 connected item, got ${progressAfterOneWire.doneCount}`);
  process.exit(1);
}
console.log('✓ TEST 3 PASSED: Wire correctly recognized by BFS reachability algorithm.');

// Test 4: Hint system generates active beacon for next missing connection
giveNextWireHint();
console.log('activeHint:', activeHint ? 'Generated' : 'None');
if (!activeHint || !activeHint.fromId || !activeHint.toId) {
  console.error('FAIL: giveNextWireHint did not set activeHint');
  process.exit(1);
}
console.log(`Hint target: ${activeHint.desc} (from ${activeHint.fromId} to ${activeHint.toId})`);
console.log('✓ TEST 4 PASSED: Hint beacon generated successfully.');

// Test 5: Clear only wires resets wires to 0 without deleting components
clearOnlyWires();
console.log(`Wires count after clearOnlyWires(): ${wires.length} (expected 0)`);
console.log(`Components count after clearOnlyWires(): ${components.length} (expected 11)`);
if (wires.length !== 0 || components.length !== 11) {
  console.error('FAIL: clearOnlyWires failed');
  process.exit(1);
}
console.log('✓ TEST 5 PASSED: clearOnlyWires() resets wires and preserves components.');

console.log('\n=============================================');
console.log('ALL STAR-DELTA PRACTICE TESTS PASSED (100%)!');
console.log('=============================================');
