// matrix-math.js
// Core matrix-based quantum operations: gate matrices, application to state, and Bloch parameter extraction
// matrix-math.js
// Handles applying gates and computing Bloch angles using matrices from matrix.js

function applyGateToState(state, gateType, qubitIndex, totalQubits, angle = Math.PI / 4, cnotPair = null) {
  if (gateType === 'CNOT') {
    const { control, target } = cnotPair;

    const dim = 2 ** totalQubits;
    const newState = math.zeros(dim, 1);

    for (let i = 0; i < dim; i++) {
      const bin = i.toString(2).padStart(totalQubits, '0').split('');
      if (bin[control] === '1') {
        // flip target bit
        bin[target] = bin[target] === '0' ? '1' : '0';
        const j = parseInt(bin.join(''), 2);
        newState.set([j, 0], state.get([i, 0]));
      } else {
        newState.set([i, 0], state.get([i, 0]));
      }
    }

    return newState;
  }


  const singleGate = typeof GATE_MATRICES[gateType] === 'function'
    ? GATE_MATRICES[gateType](angle)
    : GATE_MATRICES[gateType];

  const I = GATE_MATRICES.I;
  let fullGate = null;

  for (let i = 0; i < totalQubits; i++) {
    const op = (i === qubitIndex) ? singleGate : I;
    fullGate = fullGate ? math.kron(fullGate, op) : op;
  }

  return math.multiply(fullGate, state);
}

function calculateQubitState(state, qubitIndex, totalQubits) {
  if (totalQubits === 1) {
    const [alpha, beta] = state.toArray().map(c => math.complex(c));
    const theta = 2 * Math.acos(math.abs(alpha));
    const phi = (alpha.re !== 0 || alpha.im !== 0) ? math.arg(beta) - math.arg(alpha) : 0;
    return { theta, phi };
  }

  const amplitudes = state.toArray().map(c => math.complex(c));
  let alpha = math.complex(0);
  let beta = math.complex(0);

  for (let i = 0; i < amplitudes.length; i++) {
    const bitStr = i.toString(2).padStart(totalQubits, '0');
    const bit = bitStr[qubitIndex];
    if (bit === '0') alpha = math.add(alpha, amplitudes[i]);
    else beta = math.add(beta, amplitudes[i]);
  }

  const norm = math.sqrt(math.abs(alpha) ** 2 + math.abs(beta) ** 2);
  alpha = math.divide(alpha, norm);
  beta = math.divide(beta, norm);

  const theta = 2 * Math.acos(math.abs(alpha));
  const phi = math.arg(beta) - math.arg(alpha);
  return { theta, phi };
}

function getInitialState(qubitCount) {
  const dim = Math.pow(2, qubitCount);
  const data = Array.from({ length: dim }, (_, i) => [i === 0 ? 1 : 0]);
  return math.matrix(data);
}
