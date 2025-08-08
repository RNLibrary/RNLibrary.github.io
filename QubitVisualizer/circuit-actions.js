// circuit-actions.js

const canvas = document.getElementById('circuit-canvas');
let draggedGate = null;

// --- Gate Dragging ---
document.querySelectorAll('.gate-box').forEach(g => {
  g.setAttribute('draggable', true);
  g.addEventListener('dragstart', e => {
    const gate = g.dataset.gate || e.target.dataset.gate;
    draggedGate = gate;
    e.dataTransfer.setData('text/plain', gate);
    e.dataTransfer.effectAllowed = 'copy';
  });
});

canvas.addEventListener('dragover', e => e.preventDefault());

canvas.addEventListener('drop', e => {
  e.preventDefault();

  let gateType = e.dataTransfer.getData('text/plain');
  if (!gateType) gateType = draggedGate;
  if (!gateType) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const qubitCount = parseInt(document.getElementById('qubit-count').value);
  const spacing = canvas.height / (qubitCount + 1);
  let closestQubit = 0;
  let minDist = Infinity;

  for (let i = 0; i < qubitCount; i++) {
    const dist = Math.abs(spacing * (i + 1) - y);
    if (dist < minDist) {
      minDist = dist;
      closestQubit = i;
    }
  }

  if (gateType === 'CNOT') {
    if (qubitCount < 2) {
      alert('CNOT requires at least 2 qubits.');
      return;
    }

    const otherOptions = [...Array(qubitCount).keys()].filter(i => i !== closestQubit);
    const labelList = otherOptions.map(i => `${i + 1}`).join(' or ');
    const input = prompt(`Control set at Qubit #${closestQubit + 1}.\nChoose the target qubit:\n${labelList}`);
    const target = parseInt(input);
    if (!otherOptions.includes(target - 1)) {
      alert('Invalid target qubit.');
      return;
    }

    droppedGates.push({ x, qubitIndex: closestQubit, type: 'CNOT', id: nextGateId++, control: true });
    droppedGates.push({ x, qubitIndex: target - 1, type: 'CNOT', id: nextGateId++, control: false });

  }  else if (gateType === 'RX') {
      const input = prompt('Set θ angle in **degrees** for RX gate (0–360):', '45');
      const degrees = parseFloat(input);
      if (isNaN(degrees) || degrees < 0 || degrees > 360) return;
      const angle = degrees * Math.PI / 180;

      droppedGates.push({ x, qubitIndex: closestQubit, type: 'RX', id: nextGateId++, angle });

    } else if (gateType === 'RY') {
      const input = prompt('Set θ angle in **degrees** for RX gate (0–360):', '45');
      const degrees = parseFloat(input);
      if (isNaN(degrees) || degrees < 0 || degrees > 360) return;
      const angle = degrees * Math.PI / 180;

      droppedGates.push({ x, qubitIndex: closestQubit, type: 'RY', id: nextGateId++, angle });

    } else if (gateType === 'RZ') {
      const input = prompt('Set θ angle in **degrees** for RX gate (0–360):', '45');
      const degrees = parseFloat(input);
      if (isNaN(degrees) || degrees < 0 || degrees > 360) return;
      const angle = degrees * Math.PI / 180;

      droppedGates.push({ x, qubitIndex: closestQubit, type: 'RZ', id: nextGateId++, angle });

    } else {
      droppedGates.push({ x, qubitIndex: closestQubit, type: gateType, id: nextGateId++ });
    }


  applyAllGates();
  drawCircuit('circuit-canvas', qubitCount);
});


// --- Click to Remove Gates ---
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  canvas.clickableAreas?.forEach(area => {
    if (x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2) {
      droppedGates = droppedGates.filter(g => (area.type === 'CNOT' ? !(g.type === 'CNOT' && g.x === area.id) : g.id !== area.id));
      applyAllGates();
      drawCircuit('circuit-canvas', parseInt(document.getElementById('qubit-count').value));
      updateState();
    }
  });
});

// --- Qubit Count Slider ---
document.getElementById('qubit-count').addEventListener('input', e => {
  const count = parseInt(e.target.value);
  droppedGates = count === 1
    ? droppedGates.filter(g => g.type !== 'CNOT')
    : droppedGates.filter(g => g.qubitIndex < count);
  drawCircuit('circuit-canvas', count);
  applyAllGates();
});

// --- Reset ---
document.getElementById('reset').addEventListener('click', () => {
  droppedGates = [];
  const count = parseInt(document.getElementById('qubit-count').value);
  qubitStates.forEach(q => {
    q.theta = 0;
    q.phi = 0;
  });

  // Reset global state explicitly
  globalState = getInitialState(count);

  drawCircuit('circuit-canvas', count);
  updateState(true); // Trigger animation toward |0⟩
});


// --- Initial Draw ---
window.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('qubit-count');
  drawCircuit('circuit-canvas', parseInt(slider?.value || 1));
  applyAllGates();
});
