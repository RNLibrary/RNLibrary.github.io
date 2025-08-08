// state-utils.js

/**
 * Generate clean quantum state notation
 * @param {Array<{theta: number, phi: number}>} qubitStates 
 * @param {number} qubitCount 
 * @returns {string} formatted HTML string
 */
function generateStateText(qubitStates, qubitCount) {
  // First generate individual qubit states
  const qubitStrings = [];
  for (let q = 0; q < qubitCount; q++) {
    qubitStrings.push(formatSingleQubitState(qubitStates[q].theta, qubitStates[q].phi));
  }

  // Check if all qubits are in basis states (|0⟩ or |1⟩)
  if (qubitStrings.every(s => s === '|0⟩' || s === '|1⟩')) {
    const basisState = qubitStrings.map(s => s === '|0⟩' ? '0' : '1').join('');
    return `|${basisState}⟩`;
  }

  // Check for separable states that can be written as tensor products
  if (qubitCount > 1) {
    return qubitStrings.join(' ⊗ ');
  }

  return qubitStrings[0];
}

function formatSingleQubitState(theta, phi) {
  const tol = 1e-6; // Numerical tolerance

  // |0⟩ state
  if (Math.abs(theta) < tol) return '|0⟩';

  // |1⟩ state
  if (Math.abs(theta - Math.PI) < tol && Math.abs(phi) < tol) return '|1⟩';

  // Common superposition states
  if (Math.abs(theta - Math.PI / 2) < tol) {
    if (Math.abs(phi) < tol) return '1/√2 (|0⟩ + |1⟩)';
    if (Math.abs(phi - Math.PI) < tol) return '1/√2 (|0⟩ - |1⟩)';
    if (Math.abs(phi - Math.PI / 2) < tol) return '1/√2 (|0⟩ + i|1⟩)';
    if (Math.abs(phi + Math.PI / 2) < tol) return '1/√2 (|0⟩ - i|1⟩)';
  }

  // General superposition state
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);

  let alphaStr = formatAmplitude(alpha);
  let betaStr = formatAmplitude(beta);

  if (Math.abs(phi) > tol) {
  const pi = Math.PI;
  const formatted = angle => angle.toFixed(2);

  if (Math.abs(phi - pi / 2) < tol) {
      betaStr = `i${betaStr}`;
    } else if (Math.abs(phi - 3 * pi / 2) < tol || Math.abs(phi + pi / 2) < tol) {
      betaStr = `-i${betaStr}`;
    } else if (Math.abs(phi - pi) < tol) {
      betaStr = `- ${betaStr}`;
    } else if (Math.abs(phi - 2 * pi) < tol || Math.abs(phi) < tol) {
      // do nothing
    } else {
      betaStr = `e<sup>i${formatted(phi)}</sup>${betaStr}`;
    }
  }


  return `(${alphaStr}|0⟩ + ${betaStr}|1⟩)`;
}

function formatAmplitude(value) {
  const tol = 1e-6;

  // Handle common amplitudes
  if (Math.abs(value - 1) < tol) return '';
  if (Math.abs(value * value - 0.5) < tol) return '1/√2 ';
  if (Math.abs(value - 0.5) < tol) return '1/2 ';
  if (Math.abs(value - Math.sqrt(3) / 2) < tol) return '√3/2 ';

  // Default to 2 decimal places
  return `${value.toFixed(2)}`;
}

/**
 * Concise notation reducer: attempts to simplify product states into expanded form
 * e.g. 1/√2 (|0⟩ + |1⟩) ⊗ 1/√2 (|0⟩ + |1⟩) ⇒ 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)
 * @param {string} stateString output of generateStateText()
 * @returns {string} simplified form if recognizable, else returns input
 */
function conciseNotation(stateString) {
  const tensorParts = stateString.split('⊗').map(s => s.trim());
  const pattern = /^1\/√2 \(\|0⟩ \+ \|1⟩\)$/;

  if (!tensorParts.every(p => pattern.test(p))) return stateString;

  const n = tensorParts.length;
  const factor = `1/√${2 ** n}`;
  const basis = Array.from({ length: 2 ** n }, (_, i) => `|${i.toString(2).padStart(n, '0')}⟩`).join(' + ');

  return `${factor} (${basis})`;
}


// Add to state-utils.js

/**
 * Generate detailed math calculations for the quantum state
 * @param {Array<{theta: number, phi: number}> qubitStates 
 * @param {number} qubitCount 
 * @returns {string} HTML string with detailed calculations
 */
function generateStateDetails(qubitStates, qubitCount) {
  if (!globalState || qubitCount < 1) return '';

  let details = '<div class="state-calculation">';

  // === Initial State
  const initQubits = Array(qubitCount).fill('[1, 0]');
  details += `<strong>Initial Qubit State:</strong><br>`;
  details += `${initQubits.join(' ⊗ ')}<br><br>`;

  // === Gate Extraction
  const sortedGates = [...droppedGates].sort((a, b) => a.x - b.x);
  const gateStack = Array.from({ length: qubitCount }, () => []);

  const cnotDescriptions = [];

  for (const gate of sortedGates) {
    if (gate.type === 'CNOT') {
      if (gate.control) {
        const ctrl = gate.qubitIndex + 1;
        const tgt = gate.pair.qubitIndex + 1;
        cnotDescriptions.push(`CNOT(control: q${ctrl}, target: q${tgt})`);
      }
    } else {
      gateStack[gate.qubitIndex].unshift(gate); // stack right-to-left
    }
  }

  // === Gate Operations Summary
  details += `<strong>Gate Operations (Right-to-Left):</strong><br>`;
  const tensorTerms = gateStack.map((gates, q) => {
    if (gates.length === 0) return 'I';

    const formatted = gates.map(g => {
      if (g.angle !== undefined) {
        const deg = (g.angle * 180 / Math.PI).toFixed(0);
        return `${g.type}(${deg}°)`;
      }
      return g.type;
    });

    return formatted.join(' × ');
  });

  details += `(${tensorTerms.join(' ⊗ ')}) · |ψ₀⟩<br><br>`;

  // === CNOT Summary
  if (cnotDescriptions.length > 0) {
    details += `<strong>CNOT Gates:</strong><br>`;
    cnotDescriptions.forEach(cnot => {
      details += `${cnot}<br>`;
    });
    details += `<br>`;
  }

  // === Final Quantum State
  details += `<strong>Final State Vector:</strong><br>`;
  details += formatStateVector(globalState, qubitCount);
  details += '</div>';

  return details;
}







function formatStateVector(state, qubitCount) {
  const dim = 2 ** qubitCount;
  let html = '|ψ⟩ = ';
  
  for (let i = 0; i < dim; i++) {
    const amplitude = state.get([i, 0]);
    if (Math.abs(amplitude) < 1e-6) continue;
    
    const basis = i.toString(2).padStart(qubitCount, '0');
    html += `(${formatComplex(amplitude)})|${basis}⟩ + `;
  }
  
  // Remove trailing " + "
  return html.slice(0, -3);
}

function formatComplex(num) {
  const tol = 1e-6;
  const re = num.re || 0;
  const im = num.im || 0;
  
  if (Math.abs(im) < tol) return re.toFixed(3);
  if (Math.abs(re) < tol) return `${im.toFixed(3)}i`;
  
  const sign = im >= 0 ? '+' : '-';
  return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`;
}

function getQubitCalculation(theta, phi) {
  let calc = '|ψ⟩ = ';
  
  const alpha = Math.cos(theta/2);
  const beta = Math.sin(theta/2) * math.complex(Math.cos(phi), Math.sin(phi));
  
  calc += `${formatComplex(alpha)}|0⟩ + ${formatComplex(beta)}|1⟩<br>`;
  calc += `θ = ${theta.toFixed(3)} rad (${(theta * 180/Math.PI).toFixed(1)}°)<br>`;
  calc += `φ = ${phi.toFixed(3)} rad (${(phi * 180/Math.PI).toFixed(1)}°)`;
  
  return calc;
}