// circuit-main.js
// Responsible for drawing the visual quantum circuit and its gates

const MEAS_BOX_SIZE = 36;
let droppedGates = []; // List of all placed gates
let nextGateId = 0;     // Unique identifier for each gate

/**
 * Master function to render the circuit
 */
function drawCircuit(canvasId, qubitCount = 1) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.font = '16px Arial';
  ctx.fillStyle = '#000';

  drawNQubitCircuit(canvas, ctx, canvas.width, canvas.height, qubitCount);
}

/**
 * Draws a labeled gate box
 */
function drawGateBox(ctx, x, y, label, id, gate) {
  const size = 30;
  ctx.fillStyle = '#ecf0f1';
  ctx.strokeStyle = '#34495e';
  ctx.lineWidth = 2;

  ctx.fillRect(x - size / 2, y, size, size);
  ctx.strokeRect(x - size / 2, y, size, size);
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let display = label;
  if (label.startsWith('R') && gate?.angle !== undefined) {
    const degrees = (gate.angle * 180 / Math.PI).toFixed(0);
    display += `\n${degrees}°`;
  }
  ctx.fillText(display, x, y + size / 2);


  return { x1: x - size / 2, y1: y, x2: x + size / 2, y2: y + size, id };
}

/**
 * Draws a measurement box at end of each qubit wire
 */
function drawMeasurementSymbol(ctx, x, y) {
  ctx.strokeRect(x, y, MEAS_BOX_SIZE, MEAS_BOX_SIZE);
  const cx = x + MEAS_BOX_SIZE / 2;
  const cy = y + MEAS_BOX_SIZE / 2;

  // Line
  ctx.beginPath();
  ctx.moveTo(x, cy);
  ctx.lineTo(x + MEAS_BOX_SIZE, cy);
  ctx.stroke();

  // Arc
  ctx.beginPath();
  ctx.arc(cx, cy, 10, Math.PI, 0);
  ctx.stroke();

  // Arrow
  const angle = -Math.PI / 4;
  const ax = cx + 18 * Math.cos(angle);
  const ay = cy + 18 * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 6 * Math.cos(angle - Math.PI / 6), ay - 6 * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 6 * Math.cos(angle + Math.PI / 6), ay - 6 * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

/**
 * Draws full circuit: wires, gates, CNOT links.
 */
function drawNQubitCircuit(canvas, ctx, width, height, qubitCount) {
  const spacing = height / (qubitCount + 1);
  const clickableAreas = [];
  const cnotPairs = {};

  // Draw wires and labels
  for (let i = 0; i < qubitCount; i++) {
    const y = spacing * (i + 1);
    ctx.beginPath();
    ctx.moveTo(25, y);
    ctx.lineTo(width - 25, y);
    ctx.stroke();
    ctx.fillText('|0⟩', 5, y);
    drawMeasurementSymbol(ctx, width - 60, y - MEAS_BOX_SIZE / 2);
  }

  // Track CNOT pairs by x
  for (const g of droppedGates) {
    if (g.type === 'CNOT') {
      cnotPairs[g.x] = cnotPairs[g.x] || [];
      cnotPairs[g.x].push(g);
    }
  }

  for (const g of droppedGates) {
    const y = spacing * (g.qubitIndex + 1);

    if (g.type === 'CNOT') {
      const pair = cnotPairs[g.x]?.find(p => p.id !== g.id);
      if (!pair) continue;

      const y1 = spacing * (g.qubitIndex + 1);
      const y2 = spacing * (pair.qubitIndex + 1);
      const isControl = g.control === true;

      // Line between control and target
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.x, y1);
      ctx.lineTo(g.x, y2);
      ctx.stroke();

      // Draw control ● and target ⊕
      ctx.beginPath();
      ctx.arc(g.x, isControl ? y1 : y2, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#c0392b';
      ctx.fill();

      const ty = isControl ? y2 : y1;
      ctx.beginPath();
      ctx.arc(g.x, ty, 6, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g.x - 4, ty);
      ctx.lineTo(g.x + 4, ty);
      ctx.moveTo(g.x, ty - 4);
      ctx.lineTo(g.x, ty + 4);
      ctx.stroke();

      ctx.fillText('CNOT', g.x, Math.min(y1, y2) - 8);
      clickableAreas.push({ x1: g.x - 6, y1: Math.min(y1, y2) - 6, x2: g.x + 6, y2: Math.max(y1, y2) + 6, id: g.x, type: 'CNOT' });
    } else {
      const area = drawGateBox(ctx, g.x, y - 20, g.type, g.id, g);
      clickableAreas.push(area);
    }
  }

  canvas.clickableAreas = clickableAreas;
}
