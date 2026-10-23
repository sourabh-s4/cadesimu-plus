const fs = require('fs');
const path = require('path');

console.log('--- STARTING UNDO/REDO & DELETE COMPONENT UNIT TESTS ---');

// Mock browser globals
const elements = {};
function getMockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      textContent: '',
      innerHTML: '',
      appendChild: () => {},
      addEventListener: () => {},
      dispatchEvent: () => {}
    };
  }
  return elements[id];
}

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
  location: { pathname: '/', search: '', reload: () => {} }
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
  constructor() {
    this.destination = {};
  }
  createGain() {
    return { gain: { setValueAtTime: () => {} }, connect: () => {} };
  }
  createOscillator() {
    return { type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} };
  }
};
global.webkitAudioContext = global.AudioContext;

// Load index.html script
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  throw new Error('Could not find <script> block in index.html');
}

// Evaluate script inside sandbox
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
global.undoStack = undoStack;
global.redoStack = redoStack;
global.undo = undo;
global.redo = redo;
global.deleteSelected = deleteSelected;
global.clearSheet = clearSheet;
Object.defineProperty(global, 'isSimulating', {
  get() { return isSimulating; },
  set(v) { isSimulating = v; }
});
Object.defineProperty(global, 'selectedComp', {
  get() { return selectedComp; },
  set(v) { selectedComp = v; }
});
Object.defineProperty(global, 'selectedWire', {
  get() { return selectedWire; },
  set(v) { selectedWire = v; }
});
`);

// 1. Verify Star-Delta starter initialized on load
console.log(`[TEST 1] Initial state after loadStarDeltaStarter():`);
console.log(` - Components count: ${components.length}`);
console.log(` - Wires count: ${wires.length}`);
console.log(` - Undo stack length: ${undoStack.length}`);
if (components.length < 8) throw new Error(`Expected at least 8 components, got ${components.length}`);
if (wires.length < 15) throw new Error(`Expected >= 15 wires, got ${wires.length}`);
console.log('✓ TEST 1 PASSED: Default Star-Delta diagram initialized.\n');

// 2. Test Component Deletion & Undo/Redo
console.log(`[TEST 2] Testing Component Deletion & Undo:`);
const initialCompCount = components.length;
const initialWireCount = wires.length;

// Select KM2 (Star Contactor)
const targetComp = components.find(c => c.tag && c.tag.includes('KM2'));
if (!targetComp) throw new Error('Could not find KM2 component');

const targetTermIds = new Set(targetComp.terminals.map(t => t.id));
const connectedWiresCount = wires.filter(w => targetTermIds.has(w.fromId) || targetTermIds.has(w.toId)).length;
console.log(` - Selected target component: ${targetComp.tag} with ${connectedWiresCount} connected wires.`);

selectedComp = targetComp;
// Verify safety check while simulating
deleteSelected();
if (components.length !== initialCompCount) throw new Error('Component deleted while simulation running');
console.log('✓ Safety check verified: deletion blocked while simulation running.');

// Stop simulation to allow editing
isSimulating = false;
deleteSelected();

console.log(` - After deleteSelected():`);
console.log(`   Components count: ${components.length} (expected ${initialCompCount - 1})`);
console.log(`   Wires count: ${wires.length} (expected ${initialWireCount - connectedWiresCount})`);
console.log(`   Undo stack count: ${undoStack.length}`);

if (components.length !== initialCompCount - 1) throw new Error('Component was not deleted from components array');
if (wires.length !== initialWireCount - connectedWiresCount) throw new Error('Connected wires were not deleted');
if (undoStack.length !== 1) throw new Error('Undo stack did not increment');
console.log('✓ Component and connected wires successfully deleted.\n');

// Test Undo
console.log(`[TEST 3] Testing Undo of Component Deletion:`);
undo();
console.log(` - After undo():`);
console.log(`   Components count: ${components.length} (expected ${initialCompCount})`);
console.log(`   Wires count: ${wires.length} (expected ${initialWireCount})`);
console.log(`   Redo stack count: ${redoStack.length}`);

if (components.length !== initialCompCount) throw new Error('Undo did not restore components');
if (wires.length !== initialWireCount) throw new Error('Undo did not restore wires');
if (redoStack.length !== 1) throw new Error('Redo stack did not capture undone state');
console.log('✓ TEST 3 PASSED: Undo perfectly restored component and all attached wires.\n');

// Test Redo
console.log(`[TEST 4] Testing Redo of Component Deletion:`);
redo();
console.log(` - After redo():`);
console.log(`   Components count: ${components.length} (expected ${initialCompCount - 1})`);
console.log(`   Wires count: ${wires.length} (expected ${initialWireCount - connectedWiresCount})`);

if (components.length !== initialCompCount - 1) throw new Error('Redo did not re-delete component');
console.log('✓ TEST 4 PASSED: Redo re-deleted component and wires.\n');

// Restore state back to full diagram
undo();

// 5. Test Wire Deletion & Undo
console.log(`[TEST 5] Testing Wire Deletion & Undo:`);
const wireToDel = wires[0];
selectedWire = wireToDel;
const preWireCount = wires.length;
deleteSelected();

if (wires.length !== preWireCount - 1) throw new Error('Wire was not deleted');
if (wires.includes(wireToDel)) throw new Error('Target wire still in wires array');
console.log('✓ Wire successfully deleted.');

undo();
if (wires.length !== preWireCount) throw new Error('Undo did not restore wire');
console.log('✓ TEST 5 PASSED: Wire deletion and undo verified.\n');

// 6. Test Clear Sheet & Undo
console.log(`[TEST 6] Testing Clear Sheet & Undo:`);
clearSheet();
if (components.length !== 0 || wires.length !== 0) throw new Error('Clear sheet failed to empty canvas');
console.log('✓ Sheet cleared.');

undo();
if (components.length !== initialCompCount) throw new Error('Undo clear sheet failed to restore components');
if (wires.length !== initialWireCount) throw new Error('Undo clear sheet failed to restore wires');
console.log('✓ TEST 6 PASSED: Clear Sheet undo verified.\n');

// 7. Test Component Drag Move Undo
console.log(`[TEST 7] Testing Component Move Drag Undo:`);
const compToMove = components[0];
const origX = compToMove.x;
const origY = compToMove.y;

// Simulate drag
const snapBeforeDrag = JSON.stringify({
  components: components.map(c => ({ ...c })),
  wires: wires.map(w => ({ ...w }))
});
undoStack.push(snapBeforeDrag);

compToMove.x += 100;
compToMove.y += 100;
console.log(` - Moved ${compToMove.tag} from (${origX}, ${origY}) to (${compToMove.x}, ${compToMove.y})`);

undo();
const restoredComp = components.find(c => c.id === compToMove.id);
console.log(` - After undo(), position is (${restoredComp.x}, ${restoredComp.y})`);
if (restoredComp.x !== origX || restoredComp.y !== origY) throw new Error('Component move was not undone');
console.log('✓ TEST 7 PASSED: Component move undo verified.\n');

console.log('=============================================');
console.log('ALL 7 UNDO / REDO & DELETE UNIT TESTS PASSED!');
console.log('=============================================');
process.exit(0);
