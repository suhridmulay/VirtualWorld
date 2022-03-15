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
  powerPreference: "high-performance"
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
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

const audioListener = new THREE.AudioListener();
PLAYER.addModel(audioListener as any);

const sound = new THREE.PositionalAudio(audioListener as any);

const audioLoader = new THREE.AudioLoader();
const audioBuffer = await audioLoader.loadAsync('https://upload.wikimedia.org/wikipedia/commons/0/01/99_bottles_of_beer.ogg');
sound.setBuffer(audioBuffer);
sound.loop = true;
sound.setRefDistance(20);
sound.setRolloffFactor(0.9);

const raycaster = new THREE.Raycaster(undefined, undefined, undefined, 5);


// Add the rendering pass
const renderPass = new RenderPass(scene, PLAYER.camera);
composer.addPass(renderPass);

// Add bloom pass
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.5, 0.7);
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
  amplitude: number,
  color: THREE.Color,
}

const fireFlyGeometry = new THREE.BoxBufferGeometry(0.05, 0.05, 0.05, 1, 1, 1);

function makeLight() {
  const fireflyColor = new THREE.Color();
  fireflyColor.setHSL(Math.random(), 0.8 + 0.2 * Math.random(), 0.8 + 0.2 * Math.random())
  const fireFlyMaterial = new THREE.MeshBasicMaterial({
    color: fireflyColor,
  })
  const light = new THREE.Mesh(fireFlyGeometry, fireFlyMaterial);
  light.add(new THREE.PointLight(fireflyColor, 0.001));
  const lightmodel: FireFly = {
    model: light,
    radius: 5 + Math.random() * 5,
    angularSpeed: 2 * (Math.random() - 0.5) * 0.01,
    frequency: Math.random() * 0.01,
    amplitude: 0.25 * Math.random(),
    color: fireflyColor
  }
  return lightmodel;
}
let lights: FireFly[] = [];
function initLights() {
  for (let i = 0; i < 20; i++) {
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
  const model = await gltfLoader.loadAsync('res/models/props/birch_vibrant_1.glb');
  props = await Promise.all(loadings)
  props.forEach(p => p.scale.set(0.02, 0.02, 0.02))
  props.push(model.scene);
  const TREES = 20;
  let theta = 0;
  for (let i = 0; i < TREES; i++) {
    let choice = Math.floor(Math.random() * props.length);
    let selected = props[choice]
    selected.position.set((Math.random() - 0.5) * 20, -Math.random(), (Math.random() - 0.5) * 20);
    theta += (2 * Math.PI) / TREES;
    selected.castShadow = true;
    selected.traverse(c => {
      c.castShadow = true
      if (c instanceof THREE.Mesh) {
        (c.geometry as THREE.BufferGeometry).computeVertexNormals();
      }
    })
    const radius = 7.5;
    const offset = 2.5;
    const position = new THREE.Vector3(
      (radius + (offset * ((Math.random() * 2) - 1))) * (Math.cos(theta)),
      -Math.random(),
      (radius + (offset * ((Math.random() * 2) - 1))) * (Math.sin(theta))
    )
    let tree = selected.clone()
    tree.rotateY(Math.random() * 2 * Math.PI);
    tree.position.copy(position);
    forest.add(tree)
  }
  return forest;
}
createForest().then(forest => scene.add(forest))

grassTexture.repeat.set(2, 2);
const islandMaterial = new THREE.MeshStandardMaterial({
  color: 'green'
})
const bush = await fbxLoader.loadAsync('/res/models/props/flowers.fbx');
const bushGeometry = (bush.children[0] as THREE.Mesh).geometry;
const bushMaterial = (bush.children[0] as THREE.Mesh).material;
const ISLANDS_COUNT = 500;
const flowers = new THREE.InstancedMesh(bushGeometry, bushMaterial, ISLANDS_COUNT);
let theta = 0;
const dTheta = Math.PI * 2 / ISLANDS_COUNT;
for (let i = 0; i < ISLANDS_COUNT; i++) {
  const transform = new THREE.Object3D()
  const radius = 7;
  const offset = (Math.random() * 2 - 1) * 5;
  transform.position.set(
    (radius + offset) * Math.cos(theta),
    0,
    (radius + offset) * Math.sin(theta),
  )
  const scale = 0.4 + 0.2 * (Math.random() * 2 - 1);
  transform.scale.setScalar(scale);
  transform.rotateX((Math.random() * 2 - 1) * Math.PI * 1 / 6)
  transform.rotateZ((Math.random() * 2 - 1) * Math.PI * 1 / 6)
  transform.rotateY(Math.random() * 2 * Math.PI);
  transform.rotateX(-Math.PI / 2);
  transform.updateMatrix();
  theta += dTheta;
  flowers.setMatrixAt(i, transform.matrix);
}
scene.add(flowers);
grassTexture.repeat.set(64, 64);

async function loadBuildings() {
  const building = await fbxLoader.loadAsync(`${BASE_PATH.buildings}${BUILDINGNAMES[0]}`);
  building.scale.set(0.02, 0.02, 0.02);
  let buildingBox = new THREE.Box3().setFromObject(building);
  const size = new THREE.Vector3();
  buildingBox.getSize(size);
  const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(size.x + 2, 0.1, size.z + 2),
    new THREE.MeshBasicMaterial({
      color: 0x0f0f0f
    })
  )
  base.add(building)
  building.position.y += 0.1;
  base.position.set(15, 0, 15);
  base.lookAt(PLAYER.model.position);
  building.name = "library";
  scene.add(base);
}
loadBuildings();

// Create adverts
const ads: Advert[] = []
const ioclAd = await createAdvert('iocl', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Indian_Oil_Logo.svg/1200px-Indian_Oil_Logo.svg.png');
scene.add(ioclAd.model);
setAdvertPosition(ioclAd, new THREE.Vector3(12, 3, -12));
ads.push(ioclAd);
const fbAd = await createAdvert('fb', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/800px-2021_Facebook_icon.svg.png');
scene.add(fbAd.model);
setAdvertPosition(fbAd, new THREE.Vector3(11, 3, -11));
ads.push(fbAd);
const googleAd = await createAdvert('google', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/640px-Google_Chrome_icon_%28February_2022%29.svg.png');
scene.add(googleAd.model);
setAdvertPosition(googleAd, new THREE.Vector3(10, 3, -14));
ads.push(googleAd);

const dancer = await fbxLoader.loadAsync(`res/models/mobs/Wave Hip Hop Dance.fbx`);
dancer.scale.set(0.01, 0.01, 0.01);
dancer.position.set(12, 0, -12);
dancer.lookAt(PLAYER.position)
scene.add(dancer);
const mixer = new THREE.AnimationMixer(dancer);
const clips = dancer.animations;
const clip = THREE.AnimationClip.findByName(clips, 'mixamo.com');
const action = mixer.clipAction(clip);
action.loop = Infinity;
action.play();


// Ambient and directional light for lighting
// hemisphere light for simulating sun and reflected light
function loadLights() {
  const ambientLight = new THREE.AmbientLight(0x6060B0, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.2);
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

const groundMirror = new Reflector(
  new THREE.PlaneBufferGeometry(200, 200, 1, 1),
  {
    textureWidth: window.innerWidth,
    textureHeight: window.innerHeight,
    clipBias: 0.01,
    color: 0xfff0ff,
  }
)
groundMirror.rotateX(-Math.PI / 2);
scene.add(groundMirror),
groundMirror.position.set(0, -0.02, 0);

const plane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(200, 200, 256, 256),
  new THREE.MeshPhysicalMaterial({
    map: grassTexture,
    normalMap: grassNormal,
    transparent: true,
    metalness: 1.0,
    roughness: 0.2,
    opacity: 0.8,
    wireframe: false,
    fog: false
  }),
);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
plane.castShadow = false;
scene.add(plane);

// Add a screen
const video = document.createElement('video');
video.src = 'res/media/old.mkv';
const videoTexture = new THREE.VideoTexture(video);

const videoPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(2, 1),
  new THREE.MeshStandardMaterial({
    map: videoTexture
  })
)
videoPlane.name = 'screen';
videoPlane.position.set(0, 2, -10);
scene.add(videoPlane);
videoPlane.lookAt(PLAYER.model.position)

// Setup mouse interactions
document.addEventListener('click', (e) => {
  mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObjects(scene.children);
  console.log(intersects);
  if (intersects[0].object.name == 'Ch03') {
    if (!hud.modal.classList.contains('appear-grow')) {
      hud.modal.classList.add('appear-grow')
      hud.modal.innerText = `Welcome to A-La-Danse`
      const iframe = document.createElement('iframe');
      iframe.setAttribute('id', 'adv-site-iframe');
      iframe.src = 'https://www.youtube.com/embed/7JdEZoffm-Q';
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      iframe.allowFullscreen = true;
      iframe.style.width = "80%";
      iframe.style.height = "80%";
      iframe.style.margin = "auto";
      hud.modal.appendChild(iframe);
    }
  }

  if (intersects[0].object.name == 'screen') {
    if (video.currentTime == 0 || video.paused) {
      video.play();
      console.log('playing');
    } else {
      video.pause();
      console.log('paused');
    }
  }
})

function shaderUpdate() {
  skyShaderMaterial.uniforms.time.value = tick;
}

function gameUpdate() {
  skyball.rotateY(0.0001);
  skyball.rotateZ(0.0002);
  mixer.update(0.01);
  ads.forEach(ad => {
    ad.model.rotateY(0.01);
  })

  // If close to dancer
  if (PLAYER.model.position.distanceTo(dancer.position) < 3) {
    if (!sound.isPlaying) {
      sound.play();
    }
  } else {
    if (sound.isPlaying) {
      sound.pause();
    }
  }

  // Player out of bounds logic
  if (PLAYER.model.position.lengthSq() > 20 * 20) {
    if (!hud.modal.classList.contains('appear-grow')) {
      hud.modal.classList.add('appear-grow');
      hud.modal.innerText = "None but devils play past here, turn back!"
    }
    if (PLAYER.model.position.lengthSq() > 24 * 24) {
      hud.modal.classList.remove('appear-grow');
      PLAYER.model.position.set(0, 0, 0);
    }
  }
}

function lightsUpdate() {
  lights.forEach(l => {
    l.model.position.set(
      l.radius * Math.cos(l.angularSpeed * tick),
      0.5 + l.amplitude * Math.sin(l.frequency * 2 * Math.PI * tick),
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