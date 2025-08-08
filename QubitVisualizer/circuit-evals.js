// circuit-evals.js
// Evaluates the circuit gates and updates the qubit state accordingly

/**
 * Applies all user-placed gates to the circuit state.
 * Updates the Bloch sphere state for each qubit.
 */
// circuit-evals.js
// Evaluates the circuit gates and updates the qubit state accordingly for any number of qubits

// Add at the top of the file
// Add at the top of the file
let globalState = null;

// Modify applyAllGates to store the state
function applyAllGates() {
  const qubitCount = parseInt(document.getElementById('qubit-count').value);
  let state = getInitialState(qubitCount);

  const sortedGates = [...droppedGates].sort((a, b) => a.x - b.x);
  const usedGateIds = new Set(); // Track processed gate IDs

  for (let i = 0; i < sortedGates.length; i++) {
    const g = sortedGates[i];
    if (usedGateIds.has(g.id)) continue;

    if (g.type === 'CNOT') {
      const pair = sortedGates.find(p =>
        p.x === g.x &&
        p.id !== g.id &&
        p.type === 'CNOT' &&
        !usedGateIds.has(p.id)
      );

      if (pair) {
        const control = g.control ? g.qubitIndex : pair.qubitIndex;
        const target = g.control ? pair.qubitIndex : g.qubitIndex;

        state = applyGateToState(state, 'CNOT', null, qubitCount, undefined, { control, target });

        usedGateIds.add(g.id);
        usedGateIds.add(pair.id);

        g.pair = pair;
        pair.pair = g;
      }
    } else {
      state = applyGateToState(state, g.type, g.qubitIndex, qubitCount, g.angle);
      usedGateIds.add(g.id);
    }
  }

  globalState = state;
  updateState(true);
}

 

