// matrix.js
// Contains reusable quantum gate matrices and definitions

const GATE_MATRICES = {
  I: math.identity(2),

  H: math.multiply(1 / Math.sqrt(2), [[1, 1], [1, -1]]),
  X: [[0, 1], [1, 0]],
  Y: [[0, math.complex(0, -1)], [math.complex(0, 1), 0]],
  Z: [[1, 0], [0, -1]],

  RX: angle => math.matrix([
    [math.cos(angle / 2), math.complex(0, -Math.sin(angle / 2))],
    [math.complex(0, -Math.sin(angle / 2)), math.cos(angle / 2)]
  ]),

  RY: angle => math.matrix([
    [math.cos(angle / 2), -Math.sin(angle / 2)],
    [Math.sin(angle / 2), math.cos(angle / 2)]
  ]),

  RZ: angle => math.matrix([
    [math.exp(math.complex(0, -angle / 2)), 0],
    [0, math.exp(math.complex(0, angle / 2))]
  ]),

  CNOT: math.matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 0]
  ]),

  SWAP: math.matrix([
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1]
  ])
};
