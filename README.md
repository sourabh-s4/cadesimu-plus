# CADe_SIMU Plus (v4.2 Pro Web Edition)

An interactive, web-based, reverse-engineered modern edition of CADe_SIMU with photorealistic 2D industrial panel views, IEC 60617 schematic symbols, a true graph-based electrical solver, and interactive motor starter simulations.

![CADe SIMU Plus Banner](index.html)

## ⚡ Highlights & Key Features

* **Photorealistic 2D Industrial Panel View**:
  * Realistic 3-phase motor circuit breakers (`-QF1`), true integrated 2D contactors with built-in power poles, auxiliary NO latch contacts (13-14), and coil terminals (A1-A2).
  * 6-terminal three-phase induction motor with rotating fan blades and real-time RPM telemetry.
  * Start-Stop pushbuttons and pilot lamps.
  * Instant toggle between **2D Panel View** and standard **IEC 60617 Schematic Symbols**.
* **Star-Delta ($Y$-$\Delta$) 6-Terminal Automatic Starter**:
  * Complete 3-contactor industrial starter sequence (`-KM1` Main, `-KM2` Star with neutral bridge, `-KM3` Delta).
  * Real-time timer relay (`-KT1`) with automatic 4.0-second countdown and seamless hands-free transition from Star ($Y$ 1200 RPM) to Delta ($\Delta$ 1440 RPM).
* **Direct-on-Line (DOL) Starter**:
  * Classic self-latching auxiliary contact 13-14 holding circuit.
* **True Graph-Based BFS Electrical Solver**:
  * Real-time potential propagation (400V Hot Phase, 0V Neutral Return, Protective Earth).
  * Evaluates contactor coils, internal relay contacts, and motor winding continuity.
* **Wire Touch & Connection Inspector**:
  * Hover or click any wire to trace its origin and destination terminal pins with pulsating callout badges.
  * Live status probe shows real-time AC potential (400V/230V Hot, Neutral, or Cold).
  * Animated current dots flow along live loaded conductors.
* **Generous Anti-Overlap Routing**:
  * Clean orthogonal Manhattan wire ducts on an expansive 1400×900 sheet with zero line collisions.
* **Built-in Web Audio Synthesizer**:
  * Realistic mechanical contactor clacks, breaker clicks, and pitch-proportional motor hum.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it locally using Node.js:

```bash
node server.js
```

Then navigate to `http://localhost:8080/`.

## 🎮 How to Use the Demos

1. Select **`[⭐ Star-Delta Demo]`** or **`[⭐ DOL Demo]`** on the top toolbar.
2. Click **`▶ Simulation`** (starts automatically when choosing a preset).
3. Click the Motor Breaker **`-QF1`** to close power contacts.
4. Click the green **`[START]`** button (`-SB2`) to energize the motor.
5. In Star-Delta, watch the timer relay count down and automatically transition to full Delta speed at 4 seconds.
6. Click the red **`[STOP]`** button (`-SB1`) to shut down.
