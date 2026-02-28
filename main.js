import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.167.1/examples/jsm/controls/PointerLockControls.js";

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const targetNameEl = document.getElementById("targetName");
const hintEl = document.getElementById("hint");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);
scene.fog = new THREE.Fog(0x0b1220, 12, 45);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.75, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xbbe4ff, 0x1b2538, 1.2);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(4, 10, 5);
scene.add(dirLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(70, 70, 20, 20),
  new THREE.MeshStandardMaterial({ color: 0x142033, roughness: 0.85, metalness: 0.05 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(70, 70, 0x315174, 0x1a2c42);
grid.position.y = 0.01;
scene.add(grid);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

const worldObjects = [];
const interactables = [];

function addCrate(position) {
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x4b5f7a, roughness: 0.8 })
  );
  crate.position.copy(position);
  crate.position.y = 1;
  scene.add(crate);
  worldObjects.push(crate);
}

function addInteractable(name, position, color) {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15, roughness: 0.3 })
  );
  mesh.position.copy(position);
  mesh.userData = {
    name,
    interacted: false,
    baseColor: new THREE.Color(color),
  };
  scene.add(mesh);
  worldObjects.push(mesh);
  interactables.push(mesh);
}

addCrate(new THREE.Vector3(-5, 0, -4));
addCrate(new THREE.Vector3(3, 0, 3));
addCrate(new THREE.Vector3(8, 0, -6));

addInteractable("Energy Core", new THREE.Vector3(-2, 1, -8), 0x22d3ee);
addInteractable("Ancient Relic", new THREE.Vector3(6, 1, -2), 0xa78bfa);
addInteractable("Data Crystal", new THREE.Vector3(1, 1, 10), 0x34d399);

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

let canJump = false;
let currentTarget = null;

const playerRadius = 0.55;
const eyeHeight = 1.75;

function setMovement(event, enabled) {
  switch (event.code) {
    case "KeyW":
      movement.forward = enabled;
      break;
    case "KeyS":
      movement.backward = enabled;
      break;
    case "KeyA":
      movement.left = enabled;
      break;
    case "KeyD":
      movement.right = enabled;
      break;
    default:
      break;
  }
}

document.addEventListener("keydown", (event) => {
  setMovement(event, true);

  if (event.code === "Space" && canJump) {
    velocity.y = 8.5;
    canJump = false;
  }

  if (event.code === "KeyE" && currentTarget) {
    currentTarget.userData.interacted = true;
    currentTarget.material.emissiveIntensity = 0.5;
    currentTarget.material.color.setHex(0xfacc15);
    hintEl.textContent = `You inspected ${currentTarget.userData.name}. Keep exploring!`;
  }
});

document.addEventListener("keyup", (event) => setMovement(event, false));

startButton.addEventListener("click", () => {
  controls.lock();
});

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) {
    controls.lock();
  }
});

controls.addEventListener("lock", () => {
  overlay.classList.add("hidden");
  hintEl.textContent = "Walk up to glowing objects and press E.";
});

controls.addEventListener("unlock", () => {
  overlay.classList.remove("hidden");
  hintEl.textContent = "Click Start Exploring (or click the scene) to continue.";
});

document.addEventListener("pointerlockerror", () => {
  hintEl.textContent = "Pointer lock was blocked. Click the canvas again to start.";
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function resolveHorizontalCollisions(nextPosition) {
  for (const object of worldObjects) {
    const bounds = new THREE.Box3().setFromObject(object).expandByScalar(0.15);
    const clamped = new THREE.Vector3(
      THREE.MathUtils.clamp(nextPosition.x, bounds.min.x, bounds.max.x),
      nextPosition.y,
      THREE.MathUtils.clamp(nextPosition.z, bounds.min.z, bounds.max.z)
    );
    const distance = clamped.distanceTo(nextPosition);
    if (distance < playerRadius) {
      const push = new THREE.Vector3(nextPosition.x - clamped.x, 0, nextPosition.z - clamped.z).normalize();
      if (Number.isFinite(push.x) && Number.isFinite(push.z)) {
        nextPosition.addScaledVector(push, playerRadius - distance + 0.02);
      }
    }
  }
}

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  velocity.x -= velocity.x * 8 * delta;
  velocity.z -= velocity.z * 8 * delta;
  velocity.y -= 20 * delta;

  direction.set(
    Number(movement.right) - Number(movement.left),
    0,
    Number(movement.forward) - Number(movement.backward)
  );
  direction.normalize();

  const speed = 14;
  if (movement.forward || movement.backward) velocity.z -= direction.z * speed * delta;
  if (movement.left || movement.right) velocity.x -= direction.x * speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  const player = controls.getObject();
  player.position.y += velocity.y * delta;

  if (player.position.y < eyeHeight) {
    velocity.y = 0;
    player.position.y = eyeHeight;
    canJump = true;
  }

  const nextPosition = player.position.clone();
  resolveHorizontalCollisions(nextPosition);
  player.position.x = nextPosition.x;
  player.position.z = nextPosition.z;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const [hit] = raycaster.intersectObjects(interactables, false);

  currentTarget = hit && hit.distance < 3.25 ? hit.object : null;

  for (const item of interactables) {
    if (!item.userData.interacted) {
      item.material.color.copy(item.userData.baseColor);
      item.material.emissiveIntensity = item === currentTarget ? 0.45 : 0.15;
    }
    item.rotation.y += delta * 0.5;
  }

  if (currentTarget) {
    targetNameEl.textContent = currentTarget.userData.name;
    if (!currentTarget.userData.interacted) {
      hintEl.textContent = `Press E to inspect ${currentTarget.userData.name}.`;
    }
  } else {
    targetNameEl.textContent = "None";
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
