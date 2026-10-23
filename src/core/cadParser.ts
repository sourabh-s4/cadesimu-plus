/**
 * CADe SIMU .cad File Parser and Importer
 * Parses native CADe SIMU v1 - v4.2 format files (*.cad) into modern JSON structures.
 */

export interface CadDocumentMeta {
  format: string;
  gridSize: number;
  orientation: number;
  author?: string;
  title?: string;
}

export interface ParsedCadComponent {
  cadTypeId: number;
  instanceIndex: number;
  tag: string;
  x: number;
  y: number;
  rotation: number;
  terminals: string[];
}

export interface ParsedCadWire {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wireType: string;
}

export interface ParsedCadProject {
  meta: CadDocumentMeta;
  components: ParsedCadComponent[];
  wires: ParsedCadWire[];
}

export class CadSimuParser {
  /**
   * Parse a raw CADe SIMU string (.cad file content)
   */
  static parse(cadContent: string): ParsedCadProject {
    const project: ParsedCadProject = {
      meta: {
        format: 'CADe_SIMU',
        gridSize: 20,
        orientation: 0
      },
      components: [],
      wires: []
    };

    if (!cadContent || !cadContent.includes('CADe_SIMU')) {
      throw new Error('Invalid file: Not a recognized CADe SIMU schematic.');
    }

    // Split main sections via native delimiters
    const parts = cadContent.split('$$$');
    const headerSection = parts[0] || '';
    const componentSection = parts[1] || '';

    // 1. Parse Document Header Settings
    // e.g. CADe_SIMU*1*0*1*1*0*0*0*0*100*100*0.0000*1*1*297*210*1*1*100
    const headerMatch = headerSection.match(/CADe_SIMU\*([\d*.]+)/);
    if (headerMatch) {
      const tokens = headerMatch[1].split('*');
      project.meta.gridSize = parseInt(tokens[8]) || 20;
    }

    // 2. Parse Components and Wires
    // Component lines: *typeId*instance#tag#pin1#pin2...*x*y*rot...#extra
    const compRegex = /\*(\d+)\*(\d+)#([^#]+)#([^#]*)#([^#]*)#([^#]*)#([^#]*)\*(\d+)\*(\d+)\*(\d+)/g;
    let match;

    while ((match = compRegex.exec(componentSection)) !== null) {
      const typeId = parseInt(match[1]);
      const instId = parseInt(match[2]);
      const tag = match[3];
      const pin1 = match[4];
      const pin2 = match[5];
      const pin3 = match[6];
      const pin4 = match[7];
      const x = parseInt(match[8]);
      const y = parseInt(match[9]);
      const rot = parseInt(match[10]);

      project.components.push({
        cadTypeId: typeId,
        instanceIndex: instId,
        tag: tag.trim(),
        x,
        y,
        rotation: rot,
        terminals: [pin1, pin2, pin3, pin4].filter(p => p && p.trim().length > 0)
      });
    }

    // 3. Parse Wire Connections (&&& separated blocks or *x1*y1*x2*y2 coordinates)
    const wireRegex = /\*(\d+)\*(\d+)\*(\d+)\*(\d+)\*(\d+)\*(\d+)&&&/g;
    let wireMatch;
    while ((wireMatch = wireRegex.exec(cadContent)) !== null) {
      project.wires.push({
        x1: parseInt(wireMatch[1]),
        y1: parseInt(wireMatch[2]),
        x2: parseInt(wireMatch[3]),
        y2: parseInt(wireMatch[4]),
        wireType: 'WIRE'
      });
    }

    return project;
  }

  /**
   * Export modern schematic to native CADe SIMU .cad compatible string
   */
  static exportToCad(project: ParsedCadProject): string {
    let out = `CADe_SIMU*1*0*1*1*0*0*0*0*100*100*0.0000*1*1*297*210*1*1*100$$$\n`;

    for (const comp of project.components) {
      const pins = comp.terminals.concat(['', '', '', '']).slice(0, 4);
      out += `*${comp.cadTypeId}*${comp.instanceIndex}#${comp.tag}#${pins[0]}#${pins[1]}#${pins[2]}#${pins[3]}*${comp.x}*${comp.y}*${comp.rotation}*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0*0#\n`;
    }

    for (const wire of project.wires) {
      out += `*${wire.x1}*${wire.y1}*${wire.x2}*${wire.y2}*1*1&&&\n`;
    }

    return out;
  }
}
