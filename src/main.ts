import './style.css'
import * as THREE from 'three';
import { Player } from './player';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import grassTextureURL from '../res/textures/grass/Grass_01.png'
import grassNormalURL from '../res/textures/grass/Grass_01_Nrm.png'

/*
import bushTextureURL from '../public/res/textures/grass/Grass_01.png'
import bushNormalURL from '../public/res/textures/grass/Grass_01_Nrm.png'
*/

import playerModelUrl from '../res/models/avatar/source/eve.fbx?url';

import skyFragShader from '../res/shaders/sky/sky.frag?raw';
import skyVertShader from '../res/shaders/sky/sky.vert?raw';

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

/*
let GAME = {
  playerLocation: "forest"
}
*/

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

// Create a scene
const scene = new THREE.Scene();
// Add fog to scene for natural depth
// Add player to the scene
scene.add(PLAYER.model);
// Set the background
// scene.background = new THREE.Color(0x87ceeb);

// Adding a skyball?
const skyShaderMaterial = new THREE.ShaderMaterial({
  fragmentShader: skyFragShader,
  vertexShader: skyVertShader,
  uniforms: {
    time: {
      value: tick
    },
    fogDensity: {
      value: 0.02
    },
    fogColor: {
      value: new THREE.Color(0x0000ff)
    }
  },
  side: THREE.BackSide,
  fog: true
})

const skyball = new THREE.Mesh(
  new THREE.SphereBufferGeometry(100, 40, 40),
  skyShaderMaterial
)
scene.add(skyball);

function makeLight() {
  const geometry = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1, 1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
  })
  const light = new THREE.Mesh(geometry, material);
  light.add(new THREE.PointLight(0x0f0f0f, 0.1));
  return light;
}

let lights: THREE.Object3D[] = [];
function initLights() {
  for (let i = 0; i < 5; i++) {
    let l = makeLight();
    l.position.set(
      (Math.random() - 0.5) * 20,
      2 + 0.5 * Math.random(),
      (Math.random() - 0.5) * 20,
    )
    lights.push(l);
    scene.add(l);
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
const ambientLight = new THREE.AmbientLight(0x202020, 1.0);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.2);
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

function shaderUpdate() {
  skyShaderMaterial.uniforms.time.value = tick;
}

function gameUpdate() {
  
}

function lightsUpdate() {
  lights.forEach(l => {
    l.position.y = 1 + 0.5 * Math.sin(tick * 0.01);
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