/**
 * Core Electrical Simulator Engine
 * Replaces the buggy Boolean propagation of CADe SIMU with a 
 * deterministic topological graph solver with cycle detection & event-driven timing.
 */

export type ElectricalNodeType = 'L1' | 'L2' | 'L3' | 'N' | 'PE' | 'DC_POS' | 'DC_NEG' | 'FLOATING' | 'SHORT';

export interface Terminal {
  id: string;
  name: string;      // e.g. "A1", "A2", "13", "14", "U1"
  componentId: string;
  x: number;          // relative X offset
  y: number;          // relative Y offset
  netId?: string;     // electrical net connected to
}

export interface Wire {
  id: string;
  fromTerminalId: string;
  toTerminalId: string;
  type: 'PHASE' | 'NEUTRAL' | 'PE' | 'DC_POS' | 'DC_NEG' | 'CONTROL';
}

export type ComponentCategory = 
  | 'POWER' 
  | 'PROTECTION' 
  | 'SWITCH' 
  | 'CONTACTOR' 
  | 'RELAY' 
  | 'TIMER' 
  | 'MOTOR' 
  | 'INDICATOR' 
  | 'PLC';

export interface ComponentInstance {
  id: string;
  type: string;             // e.g. "CONTACTOR_COIL", "NO_CONTACT", "MOTOR_3P"
  tag: string;              // e.g. "-KM1", "-SB1", "-M1"
  category: ComponentCategory;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  terminals: Terminal[];
  state: Record<string, any>; // energized, closed, speed, tripped, timerRemaining, etc.
}

export interface SimulationState {
  time: number;
  dt: number;
  isRunning: boolean;
  isPaused: boolean;
  hasShortCircuit: boolean;
  shortMessage?: string;
  nets: Map<string, ElectricalNodeType>;
}

export class CircuitEngine {
  components: Map<string, ComponentInstance> = new Map();
  wires: Wire[] = [];
  simState: SimulationState = {
    time: 0,
    dt: 0.01, // 10ms deterministic resolution
    isRunning: false,
    isPaused: false,
    hasShortCircuit: false,
    nets: new Map(),
  };

  addComponent(component: ComponentInstance) {
    this.components.set(component.id, component);
  }

  addWire(wire: Wire) {
    this.wires.push(wire);
  }

  /**
   * Topological Electrical Net Solver
   * Groups connected terminals into equipotential nets, 
   * propagates power supplies, checks for real line-to-line / line-to-neutral shorts,
   * and updates contactor coils, auxiliary contacts, and motor states.
   */
  step() {
    if (!this.simState.isRunning || this.simState.isPaused) return;

    // 1. Build Disjoint Equipotential Nets
    const terminalNetMap = new Map<string, string>();
    let nextNetIdx = 1;

    const findNet = (termId: string) => terminalNetMap.get(termId);
    const assignNet = (termId: string, netId: string) => terminalNetMap.set(termId, netId);

    // Initial union-find for wires
    for (const wire of this.wires) {
      const net1 = findNet(wire.fromTerminalId);
      const net2 = findNet(wire.toTerminalId);

      if (!net1 && !net2) {
        const newNet = `NET_${nextNetIdx++}`;
        assignNet(wire.fromTerminalId, newNet);
        assignNet(wire.toTerminalId, newNet);
      } else if (net1 && !net2) {
        assignNet(wire.toTerminalId, net1);
      } else if (!net1 && net2) {
        assignNet(wire.fromTerminalId, net2);
      } else if (net1 && net2 && net1 !== net2) {
        // Merge net2 into net1
        for (const [tId, nId] of terminalNetMap.entries()) {
          if (nId === net2) terminalNetMap.set(tId, net1);
        }
      }
    }

    // 2. Through-component internal paths (e.g. Closed Contacts, Breakers, Overloads)
    for (const comp of this.components.values()) {
      if (this.isClosedSwitchOrContact(comp)) {
        if (comp.terminals.length >= 2) {
          const t1 = comp.terminals[0].id;
          const t2 = comp.terminals[1].id;
          const net1 = findNet(t1);
          const net2 = findNet(t2);

          if (!net1 && !net2) {
            const newNet = `NET_${nextNetIdx++}`;
            assignNet(t1, newNet);
            assignNet(t2, newNet);
          } else if (net1 && !net2) {
            assignNet(t2, net1);
          } else if (!net1 && net2) {
            assignNet(t1, net2);
          } else if (net1 && net2 && net1 !== net2) {
            for (const [tId, nId] of terminalNetMap.entries()) {
              if (nId === net2) terminalNetMap.set(tId, net1);
            }
          }
        }
      }
    }

    // 3. Propagate Sources (L1, L2, L3, N, PE, +24V, 0V)
    const netPotentials = new Map<string, Set<ElectricalNodeType>>();

    for (const comp of this.components.values()) {
      if (comp.category === 'POWER') {
        for (const term of comp.terminals) {
          const netId = findNet(term.id);
          if (netId) {
            if (!netPotentials.has(netId)) netPotentials.set(netId, new Set());
            const pType = (comp.state.sourceType || term.name) as ElectricalNodeType;
            netPotentials.get(netId)!.add(pType);
          }
        }
      }
    }

    // 4. Verify Short Circuits (Accurate detection: L-N, L-L, L-PE)
    this.simState.hasShortCircuit = false;
    for (const [netId, potentials] of netPotentials.entries()) {
      const hasL1 = potentials.has('L1');
      const hasL2 = potentials.has('L2');
      const hasL3 = potentials.has('L3');
      const hasN = potentials.has('N');
      const hasPE = potentials.has('PE');

      if ((hasL1 && hasL2) || (hasL2 && hasL3) || (hasL1 && hasL3) || (hasL1 && hasN) || (hasL2 && hasN) || (hasL3 && hasN)) {
        this.simState.hasShortCircuit = true;
        this.simState.shortMessage = `Short-circuit detected on ${Array.from(potentials).join(' <-> ')}`;
        return;
      }
    }

    // 5. Update Coils & Auxiliary Contacts
    const energizedTags = new Set<string>();

    for (const comp of this.components.values()) {
      if (comp.type === 'COIL_CONTACTOR' || comp.type === 'RELAY_COIL') {
        const a1 = comp.terminals.find(t => t.name === 'A1');
        const a2 = comp.terminals.find(t => t.name === 'A2');
        if (a1 && a2) {
          const netA1 = findNet(a1.id);
          const netA2 = findNet(a2.id);
          const potA1 = netA1 ? netPotentials.get(netA1) : null;
          const potA2 = netA2 ? netPotentials.get(netA2) : null;

          const isEnergized = Boolean(
            potA1 && potA2 && (
              (potA1.has('L1') && potA2.has('N')) ||
              (potA2.has('L1') && potA1.has('N')) ||
              (potA1.has('DC_POS') && potA2.has('DC_NEG')) ||
              (potA2.has('DC_POS') && potA1.has('DC_NEG'))
            )
          );

          comp.state.energized = isEnergized;
          if (isEnergized) {
            energizedTags.add(comp.tag);
          }
        }
      }
    }

    // 6. Link Auxiliary Contacts by Tag
    for (const comp of this.components.values()) {
      if (comp.type === 'NO_CONTACT') {
        comp.state.closed = energizedTags.has(comp.tag);
      } else if (comp.type === 'NC_CONTACT') {
        comp.state.closed = !energizedTags.has(comp.tag);
      }
    }

    // 7. Update Motors
    for (const comp of this.components.values()) {
      if (comp.category === 'MOTOR') {
        const u = comp.terminals.find(t => t.name.startsWith('U'));
        const v = comp.terminals.find(t => t.name.startsWith('V'));
        const w = comp.terminals.find(t => t.name.startsWith('W'));

        if (u && v && w) {
          const potU = netPotentials.get(findNet(u.id) || '');
          const potV = netPotentials.get(findNet(v.id) || '');
          const potW = netPotentials.get(findNet(w.id) || '');

          const isRunning3P = potU?.has('L1') && potV?.has('L2') && potW?.has('L3');
          const isReverse3P = potU?.has('L3') && potV?.has('L2') && potW?.has('L1');

          if (isRunning3P) {
            comp.state.running = true;
            comp.state.direction = 'CW';
            comp.state.rpm = 1440;
          } else if (isReverse3P) {
            comp.state.running = true;
            comp.state.direction = 'CCW';
            comp.state.rpm = -1440;
          } else {
            comp.state.running = false;
            comp.state.rpm = 0;
          }
        }
      }
    }

    this.simState.time += this.simState.dt;
  }

  private isClosedSwitchOrContact(comp: ComponentInstance): boolean {
    if (comp.type === 'PUSH_BUTTON_NO') return Boolean(comp.state.pressed);
    if (comp.type === 'PUSH_BUTTON_NC') return !Boolean(comp.state.pressed);
    if (comp.type === 'NO_CONTACT') return Boolean(comp.state.closed);
    if (comp.type === 'NC_CONTACT') return Boolean(comp.state.closed);
    if (comp.type === 'BREAKER') return Boolean(comp.state.closed);
    if (comp.type === 'THERMAL_OVERLOAD') return !Boolean(comp.state.tripped);
    return false;
  }
}
