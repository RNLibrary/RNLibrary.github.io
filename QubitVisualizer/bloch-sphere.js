

// Add these constants at the top of the file
const ANIMATION_DURATION = 1000; // ms
const ANIMATION_FPS = 60;
const FRAME_DURATION = 1000 / ANIMATION_FPS;

// Add these to the state section
let animationStartTime = null;
let animationTargets = [];
let currentAnimation = null;
let originalStates = [];
let lastGates = []; // Store last gates for each qubit


// ============================================================
// 🧠 State & Constants
// ============================================================
const qubitStates = Array.from({ length: 6 }, () => ({ theta: 0, phi: 0 }));
let qubitCount = 1;
let blochGroups = [];
let dynamicObjects = [];


// ============================================================
// 🛠️ Three.js Scene Initialization
// ============================================================
const container = document.getElementById('bloch-sphere');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f9fa);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(-3.5, 2.5, 8);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);


// ============================================================
// ⚙️ UI Initialization
// ============================================================
document.getElementById('qubit-count').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  document.getElementById('qubit-count-value').textContent = `${value} Qubit${value === 1 ? '' : 's'}`;
  qubitCount = value;
  createAllSpheres(value);
});

document.getElementById('reset').addEventListener('click', () => {
  qubitStates.forEach(state => {
    state.theta = 0;
    state.phi = 0;
  });
  updateState();
});

document.getElementById('qubit-count-value').textContent = '1 Qubit';


// ============================================================
// 🌐 Bloch Sphere Construction
// ============================================================
function createSphere(index, total) {
  const group = new THREE.Group();
  group.position.x = (index - (total - 1) / 2) * 3;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshPhongMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })
  );
  group.add(sphere);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x7f8c8d, transparent: true, opacity: 0.4 });

  addLongitudeLines(group, lineMaterial);
  addLatitudeLines(group, lineMaterial);
  addAxes(group);
  addArrows(group);
  addLabels(group);

  return group;
}

function addLongitudeLines(group, material) {
  for (let i = 0; i < 12; i++) {
    const points = [];
    for (let j = 0; j <= 64; j++) {
      const theta = (j / 64) * Math.PI;
      const phi = (i / 12) * 2 * Math.PI;
      points.push(new THREE.Vector3(
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.cos(phi)
      ));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
}

function addLatitudeLines(group, material) {
  for (let i = 1; i < 6; i++) {
    const theta = (i / 6) * Math.PI;
    const points = [];
    for (let j = 0; j <= 64; j++) {
      const phi = (j / 64) * 2 * Math.PI;
      points.push(new THREE.Vector3(
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.cos(phi)
      ));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
}

function addAxes(group) {
  const createAxis = (color, rotation, position) => {
    const axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.0, 10),
      new THREE.MeshBasicMaterial({ color })
    );
    if (rotation) axis.rotation[rotation.axis] = rotation.angle;
    axis.position[position.axis] = position.value * 0.7;
    group.add(axis);
  };

  createAxis(0x000000, { axis: 'z', angle: -Math.PI / 2 }, { axis: 'x', value: 0.75 });
  createAxis(0x000000, null, { axis: 'y', value: 0.75 });
  createAxis(0x000000, { axis: 'x', angle: Math.PI / 2 }, { axis: 'z', value: 0.75 });
}

function addArrows(group) {
  const addArrow = (rotAxis, rotAngle, pos, color) => {
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.1, 12),
      new THREE.MeshBasicMaterial({ color })
    );
    arrow.position.copy(pos);
    arrow.rotation[rotAxis] = rotAngle;
    group.add(arrow);
  };

  addArrow('z', -Math.PI / 2, new THREE.Vector3(1, 0, 0), 0x000000);
  addArrow('x', 0, new THREE.Vector3(0, 1, 0), 0x000000);
  addArrow('x', Math.PI / 2, new THREE.Vector3(0, 0, 1), 0x000000);
}

function addLabels(group) {
  const createLabel = (text, position, color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 128, 64);
    ctx.font = 'Bold 32px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas)
    }));
    sprite.position.copy(position);
    sprite.scale.set(0.65, 0.35, 1);
    group.add(sprite);
  };

  createLabel('|0⟩', new THREE.Vector3(0, 1.6, 0), '#000000');
  createLabel('|1⟩', new THREE.Vector3(0, -1.6, 0), '#000000');
  createLabel('x', new THREE.Vector3(0, 0, 1.3), '#000000');
  createLabel('y', new THREE.Vector3(1.3, 0, 0), '#000000');
  createLabel('z', new THREE.Vector3(0, 1.3, 0), '#000000');
}


// ============================================================
// 🔁 Qubit State Updates
// ============================================================
function updateState(animate = true) {
  if (!animate) {
    // Immediate update without animation
    updateStateImmediately();
    return;
  }

  // Setup animation
  const qubitCount = parseInt(document.getElementById('qubit-count').value);
  while (qubitStates.length < qubitCount) {
    qubitStates.push({ theta: 0, phi: 0 });
  }
  originalStates = qubitStates.slice(0, qubitCount);

  animationTargets = [];
  
  for (let i = 0; i < qubitCount; i++) {
    const { theta, phi } = calculateQubitState(globalState, i, qubitCount);
    animationTargets.push({
      theta: isNaN(theta) ? 0 : theta,
      phi: isNaN(phi) ? 0 : (phi + 2 * Math.PI) % (2 * Math.PI)
    });
  }

  animationStartTime = Date.now();
  currentAnimation = requestAnimationFrame(animateState);
}

function updateStateImmediately() {
  // Remove old arrows
  dynamicObjects.forEach(objs => objs.forEach(obj => obj.parent?.remove(obj)));
  dynamicObjects = [];

  blochGroups.forEach((group, index) => {
    if (index >= qubitCount) return;

    const { theta, phi } = qubitStates[index];
    updateArrow(group, theta, phi);
  });

  updateStateDisplay();
}

function updateArrow(group, theta, phi) {
  if (isNaN(theta) || isNaN(phi)) return;

  const x = Math.sin(theta) * Math.sin(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.cos(phi);
  const dir = new THREE.Vector3(x, y, z).normalize();

  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(), 1.1, 0xaa00ff, 0.2, 0.1);
  group.add(arrow);
  dynamicObjects.push([arrow]);
}

function animateState() {
  const now = Date.now();
  const elapsed = now - animationStartTime;
  const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

  // Remove old arrows
  dynamicObjects.forEach(objs => objs.forEach(obj => obj.parent?.remove(obj)));
  dynamicObjects = [];

  // Update each qubit's state based on animation progress
  blochGroups.forEach((group, index) => {
    if (index >= qubitCount) return;

    const original = originalStates[index];
    const target = animationTargets[index];
    
    if (!original || !target) return;

    // Get the last applied gate for this qubit
    const lastGate = getLastGateForQubit(index);
    

    //  rotation angles 
    let theta, phi;
    
  //  a fix for rx gate to nto do a spiral, rotate around X
    const isRX = lastGate?.type === 'RX';
    if (isRX) {
      // RX rotation: lock to X-Z plane (φ = 0) and animate θ
      phi = -Math.PI / 2;

      theta = original.theta + (target.theta - original.theta) * progress;
    } else {
      // Normal animation
      if (Math.abs(original.theta - target.theta) < 0.01) {
        theta = target.theta;
      } else {
        theta = original.theta + (target.theta - original.theta) * progress;
      }
      // Handle φ wrapping
      let deltaPhi = target.phi - original.phi;
      if (deltaPhi > Math.PI) deltaPhi -= 2 * Math.PI;
      if (deltaPhi < -Math.PI) deltaPhi += 2 * Math.PI;
      phi = original.phi + deltaPhi * progress;
    }


    



    // Ensure we have valid numbers
    if (isNaN(theta)) theta = 0;
    if (isNaN(phi)) phi = 0;
    
    updateArrow(group, theta, phi);
    
    // Update the actual state when animation completes
    if (progress === 1) {
      qubitStates[index].theta = isNaN(target.theta) ? 0 : target.theta;
      qubitStates[index].phi = isNaN(target.phi) ? 0 : target.phi;
    }
  });

  updateStateDisplay();

  if (progress < 1) {
    currentAnimation = requestAnimationFrame(animateState);
  } else {
    currentAnimation = null;
  }
}

// Helper function to get the last gate applied to a qubit
function getLastGateForQubit(qubitIndex) {
  const sortedGates = [...droppedGates].sort((a, b) => a.x - b.x);
  for (let i = sortedGates.length - 1; i >= 0; i--) {
    const g = sortedGates[i];
    if (g.qubitIndex === undefined) continue;
    if (g.qubitIndex === qubitIndex) {
      return g;
    }
    if (g.type === 'CNOT' && (g.qubitIndex === qubitIndex || 
        (g.pair && g.pair.qubitIndex === qubitIndex))) {
      return g;
    }
  }
  return null;
}

function createAllSpheres(count) {
  blochGroups.forEach(g => scene.remove(g));
  blochGroups = [];

  for (let i = 0; i < count; i++) {
    const group = createSphere(i, count);
    scene.add(group);
    blochGroups.push(group);
  }

  updateState();
}


// ============================================================
// 🔠 State Display (Basic Placeholder)
// ============================================================
// In bloch-sphere.js, modify the updateStateDisplay function:
function updateStateDisplay() {
  const full = generateStateText(qubitStates, qubitCount);
  const concise = conciseNotation(full);
  document.getElementById("state-info").innerHTML = `State: |ψ⟩ = ${concise}`;
  
  // Add the detailed calculations
  const details = generateStateDetails(qubitStates, qubitCount);
  document.getElementById("state-details").innerHTML = details;
}


// ============================================================
// ▶️ Render Loop
// ============================================================
// Modify the animate function to handle potential animations
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  
  // No need to call updateState here anymore
}

animate();
createAllSpheres(1);
