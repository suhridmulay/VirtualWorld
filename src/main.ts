import './style.css'
import * as THREE from 'three';
import { Player } from './player';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const grassTextureURL = 'res/textures/grass/Grass_01.png'
const grassNormalURL = 'res/textures/grass/Grass_01_Nrm.png'

/*
import bushTextureURL from '../public/res/textures/grass/Grass_01.png'
import bushNormalURL from '../public/res/textures/grass/Grass_01_Nrm.png'
*/

const playerModelUrl = 'res/models/avatar/source/eve.fbx';

const skyFragShader = 'res/shaders/sky/sky.frag';
const skyVertShader = 'res/shaders/sky/sky.vert';

const app = document.querySelector<HTMLDivElement>('#app')!

const hud = {
  time: document.querySelector<HTMLDivElement>('#time')!,
  location: document.querySelector<HTMLDivElement>('#location')!,
  modal: document.querySelector<HTMLDivElement>('#modal')!,
  controls: {
    w: document.querySelector<HTMLButtonElement>('#w')!,
    a: document.querySelector<HTMLButtonElement>('#a')!,
    s: document.querySelector<HTMLButtonElement>('#s')!,
    d: document.querySelector<HTMLButtonElement>('#d')!,
    mouseCapture: document.querySelector<HTMLButtonElement>('#capture')!
  }
}

function hudSetup() {
  // Close Modal on Click
  hud.modal.addEventListener('click', (_) => {
    hud.modal.classList.remove('appear-grow');
  })
}
hudSetup();

const mousePointer = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load(grassTextureURL)
grassTexture.wrapS = THREE.MirroredRepeatWrapping;
grassTexture.wrapT = THREE.MirroredRepeatWrapping;
grassTexture.repeat.set(64, 64);
const grassNormal = textureLoader.load(grassNormalURL);
grassNormal.wrapS = THREE.MirroredRepeatWrapping;
grassNormal.wrapT = THREE.MirroredRepeatWrapping;
grassNormal.repeat.set(64, 64);

const fbxLoader = new FBXLoader();
const forest: THREE.Object3D = new THREE.Object3D()

const BASE_PATH = {
  trees: '/res/models/trees/',
  props: '/res/models/props/',
  buildings: '/res/models/buildings/',
  mobs: '/res/models/mobs/'
}

const TREENAMES = [
  'BirchTree_1.fbx',
  'BirchTree_2.fbx',
  'CommonTree_3.fbx',
  'CommonTree_4.fbx',
  'Willow_1.fbx',
]


const renderer = new THREE.WebGLRenderer({
  antialias: window.devicePixelRatio <= 1,
  powerPreference: "high-performance"
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

// tick variable keeps track of time
let tick = 0.0;

// Create a player object and setup the camera
const PLAYER = new Player({ FOV: 60, aspect: window.innerWidth / window.innerHeight, near: 0.1, far: 1000 }, 'Forest');
PLAYER.camera.position.set(0, 1, 0);

// Register on screen HUD controls
['mousedown', 'touchstart'].forEach(e => {
  hud.controls.w.addEventListener(e, (_) => { PLAYER.motion.forward = true; PLAYER.animationState = 'accelerating'; });
  hud.controls.a.addEventListener(e, (_) => { PLAYER.motion.left = true; });
  hud.controls.s.addEventListener(e, (_) => { PLAYER.motion.reverse = true; PLAYER.animationState = 'decelerating'; });
  hud.controls.d.addEventListener(e, (_) => { PLAYER.motion.right = true; });
});

['mouseup', 'touchend'].forEach(e => {
  hud.controls.w.addEventListener(e, (_) => { PLAYER.motion.forward = false; PLAYER.animationState = 'idle'; });
  hud.controls.a.addEventListener(e, (_) => { PLAYER.motion.left = false; });
  hud.controls.s.addEventListener(e, (_) => { PLAYER.motion.reverse = false; PLAYER.animationState = 'idle'; });
  hud.controls.d.addEventListener(e, (_) => { PLAYER.motion.right = false; });
});

hud.controls.mouseCapture.addEventListener('click', (_) => {
  PLAYER.motion.mousecapture = !PLAYER.motion.mousecapture;
  hud.controls.mouseCapture.innerText = "Press C to stop";
})

document.addEventListener('keypress', (e) => {
  if (e.key == 'c') {
    hud.controls.mouseCapture.innerText = "Start Mouse Capture";
  } 
})

// Adding a sphere mesh for the player to follow
PLAYER.model.castShadow = true;
const pl = new THREE.Mesh(
  new THREE.BoxBufferGeometry(.1, .1, .1, 1, 1, 1),
  new THREE.MeshBasicMaterial({
    color: 0xffffff
  })
)
const playerLight = new THREE.PointLight(0x01011d, 0.3);
pl.add(playerLight);
PLAYER.addModel(playerLight);
playerLight.position.set(0, 0, 0);
PLAYER.setCameraPosition(new THREE.Vector3(0, 1, 2))

fbxLoader.load(playerModelUrl, (PLAYERMOB) => {
  PLAYERMOB.rotateY(Math.PI);
  PLAYERMOB.scale.set(0.1, 0.1, 0.1);
  PLAYER.addModel(PLAYERMOB)
});

const raycaster = new THREE.Raycaster(undefined, undefined, undefined, 5);

// Create a scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0000ff, 0.02);
// Add player to the scene
scene.add(PLAYER.model);

// PLACEHOLDER
const target = new THREE.Mesh(
  new THREE.SphereBufferGeometry(1),
  new THREE.MeshBasicMaterial({
    color: 0xff0000
  })
)
target.name = "target";
scene.add(target)
target.position.set(10, 1, 10);

// Adding a skyball?
const fogColor = new Float32Array(4);
fogColor.set([0.0, 0.0, 1.0, 1.0])
const skyShaderMaterial = new THREE.ShaderMaterial({
  fragmentShader: await fetch(skyFragShader).then(r => r.text()),
  vertexShader: await fetch(skyVertShader).then(r => r.text()),
  uniforms: {
    time: {
      value: tick
    },
    fogDensity: {
      value: 0.02
    },
    fogColor: {
      value: fogColor
    }
  },
  side: THREE.BackSide,
  fog: false
})

// Create a skyball for a dynamic starry sky
const skyball = new THREE.Mesh(
  new THREE.SphereBufferGeometry(100, 40, 40),
  skyShaderMaterial
)
skyball.name = "skyball";
scene.add(skyball);

// Create random lights
// Fireflies
type FireFly = {
  model: THREE.Object3D,
  radius: number,
  angularSpeed: number,
  frequency: number,
}
function makeLight() {
  const geometry = new THREE.BoxBufferGeometry(0.05, 0.05, 0.05, 1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    emissive: 0xffffff,
  })
  const light = new THREE.Mesh(geometry, material);
  light.add(new THREE.PointLight(0x0f0f0f, 0.1));
  const lightmodel: FireFly = {
    model: light,
    radius: 5 + Math.random() * 5,
    angularSpeed: Math.random() * 0.01,
    frequency: Math.random() * 0.01
  }
  return lightmodel;
}
let lights: FireFly[] = [];
function initLights() {
  for (let i = 0; i < 5; i++) {
    let l = makeLight();
    lights.push(l);
    scene.add(l.model);
  }
}
initLights();

// Create a forest
async function createForest() {
  let props: THREE.Object3D[] = []
  let loadings = [];
  for (let prop of TREENAMES) {
    const model = fbxLoader.loadAsync(`${BASE_PATH.props}${prop}`);
    loadings.push(model)
  }
  props = await Promise.all(loadings)
  props.forEach(p => p.scale.set(0.02, 0.02, 0.02))
  const TREES = 20;
  for (let i = 0; i < TREES; i++) {
    let choice = Math.floor(Math.random() * props.length);
    let selected = props[choice]
    selected.position.set(Math.random() * 10, 0, Math.random() * 10);
    const THRESHOLD = 2;
    const MAXTRIES = 20;
    const FORESTSIZE = 10;
    let tries = 0;
    while (Math.min(...forest.children.map(c => selected.position.distanceTo(c.position))) < THRESHOLD) {
      selected.position.set((Math.random() - 0.5) * 2 * FORESTSIZE, 0, (Math.random() - 0.5) * 2 * FORESTSIZE);
      tries += 1;
      if (tries > MAXTRIES) { break; }
    }
    selected.castShadow = true;
    selected.traverse(c => {
      c.castShadow = true
      if (c instanceof THREE.Mesh) {
        (c.geometry as THREE.BufferGeometry).computeVertexNormals();
      }
    })
    let tree = selected.clone()
    tree.rotateY(Math.random() * 2 * Math.PI);
    forest.add(tree)
  }
  return forest;
}
createForest().then(forest => scene.add(forest))

// Ambient and directional light for lighting
// Hemisphere light for simulating sun and reflected light
const ambientLight = new THREE.AmbientLight(0x505050, 1.0);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.color.setHSL(0.8, 0.3, 0.2);
dirLight.position.set(0, 1.75, 0);
dirLight.position.multiplyScalar(40);
scene.add(dirLight);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
const d = 40;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;
dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = - 0.0001;
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
hemiLight.color.setHSL(0.8, 0.2, 0.2);
hemiLight.groundColor.setHSL(0.5, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// Creating a ground plane to serve as ground
const plane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(200, 200, 256, 256),
  new THREE.MeshPhysicalMaterial({
    map: grassTexture,
    normalMap: grassNormal,
    wireframe: false,
    fog: false
  }),
);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = false;
scene.add(plane);

// SETUP INTERACTION WITH MOUSE
document.addEventListener('click', (e) => {
  mousePointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	mousePointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObject(target);
  if (intersects.length) {
    hud.modal.classList.add('appear-grow');
    hud.modal.innerText = "INTERACTIVE CONTENT HERE";
  }
})

function shaderUpdate() {
  skyShaderMaterial.uniforms.time.value = tick;
}

function gameUpdate() {
  
}

function lightsUpdate() {
  lights.forEach(l => {
    l.model.position.set(
      l.radius * Math.cos(l.angularSpeed * tick),
      0.5 + 0.5 * Math.sin(l.frequency * 2 * Math.PI * tick),
      l.radius * Math.sin(l.angularSpeed * tick),
    )
  })
}

function update() {
  PLAYER.update();
  gameUpdate();
  lightsUpdate();
  shaderUpdate();
}

function animate() {
  renderer.render(scene, PLAYER.camera);
  tick += 1;
  update();
  window.requestAnimationFrame(animate);
}

animate();