import './style.css'
import * as THREE from 'three';
import { Player } from './player';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

const grassTextureURL = 'res/textures/grass/Grass_01.png'
const grassNormalURL = 'res/textures/grass/Grass_01_Nrm.png'


import { Advert } from './advert';


const playerModelUrl = 'res/models/avatar/source/eve.fbx';

const app = document.querySelector<HTMLDivElement>('#app')!

const hud = {
  time: document.querySelector<HTMLDivElement>('#time')!,
  location: document.querySelector<HTMLDivElement>('#location')!,
  modal: {
    container: document.querySelector<HTMLDivElement>('#modal')!,
    content: document.querySelector<HTMLDivElement>('#modal-content')!,
    closeButtom: document.querySelector<HTMLDivElement>('#modal-close-button')!
  },
  controls: {
    w: document.querySelector<HTMLButtonElement>('#w')!,
    a: document.querySelector<HTMLButtonElement>('#a')!,
    s: document.querySelector<HTMLButtonElement>('#s')!,
    d: document.querySelector<HTMLButtonElement>('#d')!,
    mouseCapture: document.querySelector<HTMLButtonElement>('#capture')!
  },
}

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

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

const renderer = new THREE.WebGLRenderer({
  logarithmicDepthBuffer: true
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.sortObjects = true;
app.appendChild(renderer.domElement);

// Initialise an effect composer
const composer = new EffectComposer(renderer);

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
scene.fog = new THREE.FogExp2(0xc0c0c0, 0.04);

// Adding a sphere mesh for the player to follow
PLAYER.model.castShadow = false;
const playerLight = new THREE.PointLight(0x010101, 1.0);
PLAYER.addModel(playerLight);
playerLight.position.set(0, 0, 0);
PLAYER.setCameraPosition(new THREE.Vector3(0, 1.25, 2))

const GameState = {
  PlayerState: "FREEROAM",
  interationTargetPosition: new THREE.Vector3(0, 0, 0),
}

hud.modal.closeButtom.addEventListener('click', (e) => {
  hud.modal.container.classList.remove('appear-grow');
  GameState.PlayerState = "INTERESTED";
})

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

// Raycaster setup for mouse interactions
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

const groundPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(200, 200, 100, 100),
  new THREE.MeshStandardMaterial({
    map: grassTexture,
    normalMap: grassNormal,
  })
)
groundPlane.rotateX(-Math.PI / 2);
scene.add(groundPlane);

// Create a skyball
const skyball = new THREE.Mesh(
  new THREE.SphereBufferGeometry(100, 40, 40),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load('res/backgrounds/vnit_pan_2.png'),
    fog: true,
    side: THREE.BackSide
  })
)
skyball.name = "skyball";
scene.add(skyball);


function loadLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 10);
  dirLight.color.setHSL(0.5, 0.3, 0.2);
  dirLight.position.set(0, 1.75, 0);
  dirLight.position.multiplyScalar(40);
  scene.add(dirLight);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
  hemiLight.color.setHSL(0.3, 0.5, 0.8);
  hemiLight.groundColor.setHSL(0.6, 0.3, 0.4);
  scene.add(hemiLight);
}
loadLights();

let ads: Advert[] = []
const adPanel = await gltfLoader.loadAsync('res/models/misc/Spons Panel.glb');
adPanel.scene.scale.setScalar(0.001);
const adTexture = await textureLoader.loadAsync('res/backgrounds/vnit_pan_2.png');
const ad = new Advert("Your Firm", "Your Message", adTexture, adPanel.scene, new THREE.Vector3(1.375, 1.375, 0.01))
ads.push(ad);
scene.add(ad._model);
ad._model.position.set(0, 0, -25);

const ad2 = new Advert("Their Firm", "Their Message", adTexture, adPanel.scene, new THREE.Vector3(1.375, 1.375, 0.01))
ads.push(ad2);
scene.add(ad2._model);
ad2._model.position.set(5, 0, -25);

const ad3 = new Advert("My Firm", "My Message", adTexture, adPanel.scene, new THREE.Vector3(1.375, 1.375, 0.01))
ads.push(ad3);
scene.add(ad3._model);
ad3._model.position.set(-5, 0, -25);


// renderer.compile(scene, PLAYER.camera);

const concreteTexture = await textureLoader.loadAsync('res/textures/concrete/base.jpg')
const concreteNormalTexture = await textureLoader.loadAsync('res/textures/concrete/normal.jpg')
const concreteBumpTexture = await textureLoader.loadAsync('res/textures/concrete/height.png')
const concreteAOTexture = await textureLoader.loadAsync('res/textures/concrete/ao.jpg')
const concreteRoughnessTexture = await textureLoader.loadAsync('res/textures/concrete/roughness.jpg')

const hoboModel = await gltfLoader.loadAsync('res/models/misc/hobo.glb');
hoboModel.scene.scale.setScalar(0.001);
const hoboBaseGeometry = new THREE.CylinderBufferGeometry(3, 3, 0.3, 36, 1);
const hoboBaseMaterial = new THREE.MeshStandardMaterial({
  map: concreteTexture,
  normalMap: concreteNormalTexture,
  bumpMap: concreteBumpTexture,
  aoMap: concreteAOTexture,
  roughness: 0.5,
  roughnessMap: concreteRoughnessTexture
})
const hoboBase = new THREE.Mesh(hoboBaseGeometry, hoboBaseMaterial);
const hobo = new THREE.Object3D()
hobo.add(hoboBase);
hobo.add(hoboModel.scene);
scene.add(hobo);

hobo.position.set(0, 0, -10);

// Setup mouse interactions
document.addEventListener('click', (e) => {
  mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  console.log(intersects);
})

function gameUpdate() {
  // Rotate hobo model
  hobo.rotateY(0.02);
  // Rotate interaction rings for ads
  ads.forEach(ad => {
    ad._interactionRing.rotation.x = -Math.PI/2 + 0.25 * Math.cos(worldClock.getElapsedTime() * 2)
    ad._interactionRing.rotation.y = 0.25 * Math.sin(worldClock.getElapsedTime() * 2)
  })

  // Check for ad interations
  if (GameState.PlayerState == "FREEROAM") {
    ads.forEach(ad => {
      let ip =  new THREE.Vector3();
      ad._interactionRing.getWorldPosition(ip);
      if (ip.projectOnPlane(new THREE.Vector3(0, 1, 0)).distanceTo(PLAYER.model.position) < 0.6) {
        GameState.PlayerState = "INTERACTING"
        GameState.interationTargetPosition.copy(ip)
        hud.modal.container.classList.add('appear-grow');
        hud.modal.content.innerText = `Welcome to Aarohi'22 sponsored by: ${ad._firmname}, they say: ${ad._message}` 
      }
    })
  }

  if (GameState.PlayerState == "INTERESTED") {
    console.log(PLAYER.model.position.distanceTo(GameState.interationTargetPosition))
    if (PLAYER.model.position.distanceTo(GameState.interationTargetPosition) > 1.0) {
      GameState.PlayerState = "FREEROAM"
    }
  }
}

function update() {
  if (GameState.PlayerState != "INTERACTING") {
    PLAYER.update(worldClock.getDelta());
  }
  gameUpdate();
}

function animate() {
  composer.render();
  update();
  window.requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  PLAYER.camera.aspect = window.innerWidth / window.innerHeight;
  PLAYER.camera.updateProjectionMatrix();
})

animate();
