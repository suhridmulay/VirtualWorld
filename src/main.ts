import './style.css'
import * as THREE from 'three';
import { Player } from './player';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

import { Reflector } from 'three/examples/jsm/objects/Reflector';

const grassTextureURL = 'res/textures/grass/Grass_01.png'
const grassNormalURL = 'res/textures/grass/Grass_01_Nrm.png'


import bushTextureURL from '/res/textures/grass/Grass_04.png'
import bushNormalURL from '/res/textures/grass/Grass_04_Nrm.png'
import { Advert, createAdvert, setAdvertPosition } from './advert';


const playerModelUrl = 'res/models/avatar/source/eve.fbx';

const skyFragShader = 'res/shaders/sky/sky.frag';
const skyVertShader = 'res/shaders/sky/sky.vert';

const groungVertShader = 'res/shaders/ground/ground.vert';
const groungFragShader = 'res/shaders/ground/ground.frag';

const heightmapTextureURL = 'res/textures/terrain_hmap.png'

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
  },
}

function hudSetup() {
  // Close Modal on Click
  hud.modal.addEventListener('click', (_) => {
    hud.modal.classList.remove('appear-grow');
    hud.modal.innerHTML = '';
  })
}
hudSetup();

const mousePointer = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load(grassTextureURL)
grassTexture.wrapS = THREE.MirroredRepeatWrapping;
grassTexture.wrapT = THREE.MirroredRepeatWrapping;
grassTexture.repeat.set(64, 64);

grassTexture.repeat.set(64, 64);
const grassNormal = textureLoader.load(grassNormalURL);
grassNormal.wrapS = THREE.MirroredRepeatWrapping;
grassNormal.wrapT = THREE.MirroredRepeatWrapping;
grassNormal.repeat.set(64, 64);

const heightMap = textureLoader.load(heightmapTextureURL);
heightMap.repeat.set(64, 64);
heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping;

const bushTexture = textureLoader.load(bushTextureURL);
bushTexture.wrapT = THREE.MirroredRepeatWrapping;
bushTexture.wrapS = THREE.MirroredRepeatWrapping;
bushTexture.repeat.set(50, 2);
const bushNormal = textureLoader.load(bushNormalURL);

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
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
  'Willow_2.fbx',
]

const BUILDINGNAMES = [
  'Building1_Large.fbx'
]


const renderer = new THREE.WebGLRenderer({
  logarithmicDepthBuffer: true
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.sortObjects = true;
app.appendChild(renderer.domElement);

// Initialise an effect composer
const composer = new EffectComposer(renderer);


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


// Clock to keep track of time
const worldClock = new THREE.Clock();

// Create a scene
const scene = new THREE.Scene();
scene.add(PLAYER.model);

// Adding a sphere mesh for the player to follow
PLAYER.model.castShadow = false;
const playerLight = new THREE.PointLight(0x010101, 1.0);
PLAYER.addModel(playerLight);
playerLight.position.set(0, 0, 0);
PLAYER.setCameraPosition(new THREE.Vector3(0, 1.25, 2))

fbxLoader.load(playerModelUrl, (PLAYERMOB) => {
  PLAYERMOB.rotateY(Math.PI);
  PLAYERMOB.scale.set(0.1, 0.1, 0.1);
  PLAYERMOB.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      (obj.material as THREE.MeshStandardMaterial).metalness = 1.0;
      (obj.material as THREE.MeshStandardMaterial).roughness = 0.0;
    }
  })
  PLAYER.addModel(PLAYERMOB)
});

const raycaster = new THREE.Raycaster(undefined, undefined, undefined, 5);


// Add the rendering pass
const renderPass = new RenderPass(scene, PLAYER.camera);
composer.addPass(renderPass);

// Add bloom pass
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.5, 0.9);
composer.addPass(bloomPass);

// Add anti-aliasing pass
// Only when the we are operating at 1:1 pixel ratio. Otherwise, it's pretty useless
if (window.devicePixelRatio <= 1) {
  const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
  composer.addPass(smaaPass);
}

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

const groundPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(200, 200, 100, 100),
  new THREE.MeshBasicMaterial({
    color: 'green',
    wireframe: true,
  })
)
groundPlane.rotateX(-Math.PI/2);
scene.add(groundPlane);

// Create a skyball for a dynamic starry sky
const skyball = new THREE.Mesh(
  new THREE.SphereBufferGeometry(100, 40, 40),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load('res/backgrounds/vnit_pan_2.png'),
    fog: false,
    side: THREE.BackSide
  })
)
skyball.name = "skyball";
scene.add(skyball);

// Ambient and directional light for lighting
// hemisphere light for simulating sun and reflected light
function loadLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.color.setHSL(0.8, 0.3, 0.2);
  dirLight.position.set(0, 1.75, 0);
  dirLight.position.multiplyScalar(40);
  scene.add(dirLight);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
  hemiLight.color.setHSL(0.8, 0.2, 0.2);
  hemiLight.groundColor.setHSL(0.5, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);
}
loadLights();

// Setup mouse interactions
document.addEventListener('click', (e) => {
  mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObjects(scene.children);
  console.log(intersects);
})

function shaderUpdate() {
  skyShaderMaterial.uniforms.time.value = tick;
}

function gameUpdate() {
  
}

function update() {
  PLAYER.update(worldClock.getDelta());
  gameUpdate();
  shaderUpdate();
}

function animate() {
  composer.render();
  tick += 1;
  update();
  window.requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  PLAYER.camera.aspect = window.innerWidth / window.innerHeight;
  PLAYER.camera.updateProjectionMatrix();
})

animate();