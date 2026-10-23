/**
 * Procedural Vector 2D Electrical Renderer
 * Renders realistic industrial panel-mount components in 2D mode:
 * - 3P Thermal-Magnetic Circuit Breakers (MCCBs) with toggle handles
 * - Power Contactors (Schneider/Siemens style with A1-A2 coil windows and NO/NC terminals)
 * - 3-Phase Induction Motors with cooling fins, terminal box, and rotating fan shaft
 * - Din-Rail Star-Delta / Multifunction Electronic Timers with LED indicator & dials
 * - Industrial Pushbuttons & Pilot Lamps (22mm panel mount with metallic bevels)
 */

export class Renderer2D {
  static draw3PBreaker(ctx: CanvasRenderingContext2D, comp: any) {
    const { width, height, state, tag } = comp;
    
    // Outer Enclosure (Molded Case Dark Gray)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#2d313b');
    grad.addColorStop(1, '#1b1d24');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#434753';
    ctx.lineWidth = 2;
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Screw Terminals Top (1, 3, 5) & Bottom (2, 4, 6)
    ctx.fillStyle = '#b0b5c0';
    for (const x of [15, width / 2, width - 15]) {
      // Top Screw
      ctx.beginPath();
      ctx.arc(x, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Bottom Screw
      ctx.beginPath();
      ctx.arc(x, height - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Toggle Switch Lever Cavity
    ctx.fillStyle = '#111215';
    ctx.fillRect(width / 2 - 12, height / 2 - 18, 24, 36);

    // Toggle Handle (Flips Up when ON, Down when OFF)
    ctx.fillStyle = state.closed ? '#e63946' : '#555a64';
    const handleY = state.closed ? height / 2 - 14 : height / 2 + 2;
    ctx.roundRect(width / 2 - 10, handleY, 20, 12, 2);
    ctx.fill();

    // Toggle Handle Label (I / O)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(state.closed ? 'I (ON)' : 'O (OFF)', width / 2 - 14, height / 2 + (state.closed ? -4 : 11));

    // Nameplate Label
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(tag || '-QF1', 6, height / 2 + 2);
  }

  static drawContactor(ctx: CanvasRenderingContext2D, comp: any) {
    const { width, height, state, tag } = comp;

    // Contactor White/Light Gray Base
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#e5e7eb');
    bgGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Central Coil Status Window
    ctx.fillStyle = state.energized || state.closed ? '#059669' : '#64748b';
    ctx.fillRect(width / 2 - 14, height / 2 - 12, 28, 24);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(width / 2 - 14, height / 2 - 12, 28, 24);

    // Moving Contact Arm Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(state.energized || state.closed ? 'IN' : 'OUT', width / 2 - 8, height / 2 + 3);

    // Terminal Screw Cavities
    ctx.fillStyle = '#64748b';
    for (const x of [12, width / 2 - 16, width / 2 + 16, width - 12]) {
      ctx.fillRect(x - 3, 2, 6, 6);
      ctx.fillRect(x - 3, height - 8, 6, 6);
    }

    // Nameplate
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(tag || '-KM1', 6, 20);
    ctx.font = '7px sans-serif';
    ctx.fillText('AC-3 400V', 6, 30);
  }

  static drawMotor3P(ctx: CanvasRenderingContext2D, comp: any) {
    const { width, height, state, tag } = comp;

    // Motor Stator Housing (Cast Iron Blue/Teal)
    const statorGrad = ctx.createLinearGradient(0, 0, width - 20, 0);
    statorGrad.addColorStop(0, '#1e3a5f');
    statorGrad.addColorStop(0.5, '#2563eb');
    statorGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = statorGrad;
    ctx.roundRect(0, 10, width - 25, height - 20, 6);
    ctx.fill();

    // Cooling Fins (Vertical ribbed stripes)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let x = 10; x < width - 35; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, height - 10);
      ctx.stroke();
    }

    // Terminal Box (Top mount black plastic)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 0, 30, 12);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(15, 0, 30, 12);

    // Rotor Shaft & Front Bearing Plate
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(width - 25, height / 2 - 10, 8, 20); // Bearing flange
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(width - 17, height / 2 - 4, 17, 8);  // Shaft extension

    // Animated Rotating Fan / Shaft Indicator
    ctx.save();
    ctx.translate(width - 8, height / 2);
    ctx.rotate((comp.state.angle || 0) * Math.PI / 180);
    ctx.fillStyle = state.running ? '#06d6a0' : '#475569';
    ctx.fillRect(-2, -6, 4, 12);
    ctx.fillRect(-6, -2, 12, 4);
    ctx.restore();

    // Rating Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(tag || '-M1', 12, height - 16);
    ctx.font = '8px sans-serif';
    ctx.fillStyle = state.running ? '#06d6a0' : '#cbd5e1';
    ctx.fillText(state.running ? `${state.rpm || 1440} RPM` : 'STOPPED', 12, height - 6);
  }

  static drawPushButton(ctx: CanvasRenderingContext2D, comp: any, isStart: boolean) {
    const { width, height, state, tag } = comp;

    // 22mm Chrome Bezel (Silver Gradient)
    const bezel = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, 22);
    bezel.addColorStop(0, '#f8fafc');
    bezel.addColorStop(0.7, '#94a3b8');
    bezel.addColorStop(1, '#475569');
    ctx.fillStyle = bezel;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Button Cap (Green for START, Red for STOP)
    const baseColor = isStart ? (state.pressed ? '#059669' : '#10b981') : (state.pressed ? '#991b1b' : '#ef4444');
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, state.pressed ? 13 : 15, 0, Math.PI * 2);
    ctx.fill();

    // 3D Button Highlight ring
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, state.pressed ? 11 : 13, 0, Math.PI * 2);
    ctx.stroke();

    // Text Label below
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(tag || (isStart ? '-SB2' : '-SB1'), width / 2 - 12, height - 2);
  }

  static drawPilotLamp(ctx: CanvasRenderingContext2D, comp: any) {
    const { width, height, state, tag } = comp;

    // Chrome Bezel
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 4, 18, 0, Math.PI * 2);
    ctx.fill();

    // Dome Lens (Glows Yellow/Amber when energized)
    if (state.energized) {
      const glow = ctx.createRadialGradient(width / 2, height / 2 - 4, 2, width / 2, height / 2 - 4, 18);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.3, '#fef08a');
      glow.addColorStop(0.8, '#eab308');
      glow.addColorStop(1, '#ca8a04');
      ctx.fillStyle = glow;
    } else {
      ctx.fillStyle = '#78350f';
    }
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 4, 14, 0, Math.PI * 2);
    ctx.fill();

    // Tag
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(tag || '-HL1', width / 2 - 10, height - 2);
  }
}
