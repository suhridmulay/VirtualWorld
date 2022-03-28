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
import { Artwork } from './artowrk';
import Hls from 'hls.js';
import { MediaPlatform } from './MediaPlatform';
import { TreasureHuntManager } from './treasure';

// import * as URLs from './URLS.json';


const playerModelUrl = 'res/models/avatar/source/eve.fbx';

const app = document.querySelector<HTMLDivElement>('#app')!
const preloader = document.querySelector<HTMLDivElement>('#preloader')!

// let contentLoaded = false;

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

function taxicabDistance(v1: THREE.Vector3, v2: THREE.Vector3){
  let d = Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z)
  return d
}


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

hud.modal.closeButtom.addEventListener('click', (_) => {
  hud.modal.container.classList.remove('appear-grow');
  hud.modal.content.innerHTML = '';
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
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.5, 1.0);
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
    color: 0x87ceeb,
    fog: true,
    side: THREE.BackSide
  })
)
skyball.name = "skyball";
scene.add(skyball);


function loadLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 8);
  dirLight.color.setHSL(0.5, 0.3, 0.2);
  dirLight.position.set(0, 1.75, 0);
  dirLight.position.multiplyScalar(5);
  scene.add(dirLight);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  hemiLight.color.setHSL(0.3, 0.5, 0.8);
  hemiLight.groundColor.setHSL(0.6, 0.3, 0.4);
  scene.add(hemiLight);
}
loadLights();

// Ads
const adBasePath = 'res/logos/';
const adURLs = [
  {
    path: 'chatur-ideas.png',
    firm: 'Crypto University',
    message: 'Crypto University'
  },
  {
    path: 'mahila.png',
    firm: 'Dharampeth Mahila Bank',
    message: 'Dharampeth Mahila Bank',
  },
  {
    path: 'empower.png',
    firm: 'empower',
    message: 'empower',
  },
  {
    path: 'made-easy.png',
    firm: 'made-easy',
    message: 'made-easy',
  },
  {
    path: 'nest-amd-sppon.png',
    firm: 'nest and spoon',
    message: 'nest and spoon'
  },
  {
    path: 'wcl.png',
    firm: 'WCL',
    message: 'WCL'
  }
]
let ads: Advert[] = []
let adZ = -15;
const adPanel = await gltfLoader.loadAsync('res/models/misc/Spons Panel.glb');
adPanel.scene.scale.setScalar(0.001);
for (let adv of adURLs) {
  const adTexture = await textureLoader.loadAsync(`${adBasePath}${adv.path}`);
  const ad = new Advert(adv.firm, adv.message, adTexture, adPanel.scene, new THREE.Vector3(1.375, 1.375, 0.01))
  ads.push(ad)
  scene.add(ad._model)
  ad._model.rotateY(-Math.PI / 2)
  ad._model.position.set(
    15,
    0,
    adZ
  )
  adZ += 5;
}

// Artwork
let artworks: Artwork[] = []
const artworkPanel = await fbxLoader.loadAsync('res/models/misc/Display Panels.fbx');
artworkPanel.scale.setScalar(0.001);
const artowrkTexture = grassNormal;
const artowrk = new Artwork("My Artwork", "My Canvas", artowrkTexture, artworkPanel, new THREE.Vector3(3.1875, 1.5, -1));
artworks.push(artowrk)
scene.add(artowrk._model);
artowrk._model.position.set(-10, 0, 0);
artowrk._model.lookAt(PLAYER.position);

// Hedge
const hedgeTexture = await textureLoader.loadAsync('res/textures/hedge/base.jpg');
hedgeTexture.wrapS = hedgeTexture.wrapT = THREE.MirroredRepeatWrapping;
hedgeTexture.repeat.set(200, 5)
const hedgeNormalTexture = await textureLoader.loadAsync('res/textures/hedge/normal.jpg');
const hedgeBumpTexture = await textureLoader.loadAsync('res/textures/hedge/height.png');
const hedgeAOTexture = await textureLoader.loadAsync('res/textures/hedge/ao.jpg');
const hedgeRoughnessTexture = await textureLoader.loadAsync('res/textures/hedge/roughness.jpg');
const hedge = new THREE.Mesh(
  new THREE.TorusBufferGeometry(50, 1, 30, 120),
  new THREE.MeshStandardMaterial({
    map: hedgeTexture,
    normalMap: hedgeNormalTexture,
    bumpMap: hedgeBumpTexture,
    aoMap: hedgeAOTexture,
    roughness: 1.0,
    roughnessMap: hedgeRoughnessTexture
  })
)
hedge.rotateX(-Math.PI / 2)
scene.add(hedge)

// Vegetation
const bushModel = await gltfLoader.loadAsync('res/models/props/bush.glb');
const bush = bushModel.scene;
bush.scale.setScalar(0.005);

console.log(bush);

const bushInstances = new THREE.InstancedMesh(
  (bush.children[0].children[0] as THREE.Mesh).geometry,
  (bush.children[0].children[0] as THREE.Mesh).material,
  100
)
const R = 30;
const transfromDummy = new THREE.Object3D();
for (let i = 0; i < 100; i++) {
  const theta = Math.random() * 2 * Math.PI;
  const offset = (Math.random() * 2 - 1) * 5
  transfromDummy.position.set(
    (R + offset) * Math.cos(theta),
    0.5 * 0.5 * Math.random(),
    (R + offset) * Math.sin(theta)
  )
  transfromDummy.scale.setScalar(Math.random() * 0.5);
  transfromDummy.updateMatrix();
  bushInstances.setMatrixAt(i, transfromDummy.matrix);
}
scene.add(bushInstances);


// Hobo
const hobo = new THREE.Object3D()
const hoboModel = await gltfLoader.loadAsync('res/models/misc/Hobo.glb');
const marbleTexture = await textureLoader.load('res/textures/marble/Marble021_1K_Color.jpg');
marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
marbleTexture.repeat.set(8, 8);
const marbleRoughnessTexture = await textureLoader.load('res/textures/marble/Marble021_1K_Roughness.jpg');

hoboModel.scene.traverse(c => {
  if (c instanceof THREE.Mesh) {
    (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({
      map: marbleTexture,
      color: 0x0a0b0f,
      roughnessMap: marbleRoughnessTexture,
      roughness: 0.7,
      metalness: 0.3
    })
  }
})

hoboModel.scene.scale.setScalar(0.001);
const hoboBaseGeometry = new THREE.CylinderBufferGeometry(3, 3, 0.3, 72, 1);
const hoboBaseMaterial = new THREE.MeshStandardMaterial({
  map: marbleTexture,
  roughness: 0.8,
  metalness: 0.2,
  roughnessMap: marbleRoughnessTexture
})
const hoboBase = new THREE.Mesh(hoboBaseGeometry, hoboBaseMaterial);
hobo.add(hoboBase);
hobo.add(hoboModel.scene);
scene.add(hobo);
hobo.position.set(0, 0, -20);
hobo.traverse(c => {
  if (c instanceof THREE.Mesh) {
    ((c as THREE.Mesh).material as THREE.Material).fog = false;
  }
})


// Dome
const domeModel = await gltfLoader.loadAsync('res/models/misc/Dome 2.glb')
const dome = domeModel.scene;
dome.traverse(c => {
  if (c instanceof THREE.Mesh) {
    ((c as THREE.Mesh).material as THREE.Material).fog = false;
  }
})
dome.scale.setScalar(1.5)
dome.position.y -= 0.5;
scene.add(dome)

//oat
const oat = new THREE.Object3D()
const otaModel = await gltfLoader.loadAsync('res/models/misc/OAT.glb')
oat.add(otaModel.scene)
oat.position.y -= 0.01
scene.add(oat)


// Showcase stage for sponsors or movies
// Livestream jama lo bas, This thing is gold
const showcase = new THREE.Object3D();
const showcaseStageMaterial = hoboBaseMaterial;
const showcasePlatform = new THREE.Mesh(
  new THREE.BoxBufferGeometry(8, 0.3, 4),
  showcaseStageMaterial
);
showcase.add(showcasePlatform);
const showcaseVideo = document.createElement('video');
let videoSource = 'https://cph-msl.akamaized.net/hls/live/2000341/test/master.m3u8';
if (Hls.isSupported()) {
  let hls = new Hls();
  hls.loadSource(videoSource);
  hls.attachMedia(showcaseVideo)
}

// Media Platforms
const mediPlatforms: MediaPlatform[] = [];

const mediaPlatformBase = showcasePlatform.clone();
const kochikameVideo = document.createElement('video');
kochikameVideo.src = 'res/media/Ryotsu the detective Part 1.mp4';
const mediaPlatform = new MediaPlatform('kochikame', mediaPlatformBase, kochikameVideo)
mediPlatforms.push(mediaPlatform);
mediaPlatform._model.translateZ(15);
mediaPlatform._model.translateX(-5);
scene.add(mediaPlatform._model)

const liveVideoPlatform = new MediaPlatform('lvp', mediaPlatformBase, showcaseVideo)
mediPlatforms.push(liveVideoPlatform)
scene.add(liveVideoPlatform._model)
liveVideoPlatform._model.position.set(5, 0, 15);

// Treasure Hunt
const treasureModel = await fbxLoader.loadAsync('res/models/decor/Chest_Gold.fbx');
const treasure = treasureModel;
treasure.scale.setScalar(0.01);
treasure.traverse(t => {
  if (t instanceof THREE.Mesh) {
    t.name = "treasure"
  }
});
const treasureHuntManager = new TreasureHuntManager();
function treasureSpawn() {
  scene.remove(treasureHuntManager.currentSpawnModel);
  const coords = new THREE.Vector3(10, 0, 30);
  if (GameState.PlayerState == "FREEROAM") {
    treasureHuntManager.spawnTreasure(scene, treasure, coords);
    hud.modal.container.classList.add('appear-grow');
    hud.modal.content.innerText = "A Treasure has spawned on the map, be the first to reveal it and send to @aarohiworld for a chance to win exciting prizes";
    GameState.PlayerState = "INTERACTING";
    GameState.interationTargetPosition.copy(PLAYER.model.position);
  }
}
setTimeout(treasureSpawn, 5000);

// Setup mouse interactions
document.addEventListener('click', (e) => {
  mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  console.log(intersects);

  if (intersects) {
    if (intersects[0].object.name == "treasure") {
      const message = treasureHuntManager.findTreasure();
      hud.modal.container.classList.add('appear-grow');
      hud.modal.content.appendChild(message);
      GameState.PlayerState = "INTERACTING";
      GameState.interationTargetPosition.copy(PLAYER.model.position);
      scene.remove(treasure);
    }
  }
})

let activeMediaPlatform: MediaPlatform | undefined = undefined;
function gameUpdate() {

  const up = new THREE.Vector3(0, 1, 0);

  // Rotate hobo model
  hobo.rotateY(2 * Math.PI / 240);

  // Rotate interaction rings for ads
  
  /*
  ads.forEach(ad => {
    ad._interactionRing.rotation.x = -Math.PI / 2 + 0.25 * Math.cos(worldClock.getElapsedTime() * 2)
    ad._interactionRing.rotation.y = 0.25 * Math.sin(worldClock.getElapsedTime() * 2)
  })
  */

  // Rotate interaction rings for artworks
  artworks.forEach(artwork => {
    artwork._interactionRing.rotation.x = -Math.PI / 2 + 0.25 * Math.cos(worldClock.getElapsedTime() * 2)
    artwork._interactionRing.rotation.y = 0.25 * Math.sin(worldClock.getElapsedTime() * 2)
  })

  // Rotate interaction rings for media platforms
  mediPlatforms.forEach(mp => {
    mp._controlRing.rotation.x = -Math.PI / 2 + 0.25 * Math.cos(worldClock.getElapsedTime() * 2)
    mp._controlRing.rotation.y = 0.25 * Math.sin(worldClock.getElapsedTime() * 2)
  })
  

  if (GameState.PlayerState == "FREEROAM") {
    let cp = new THREE.Vector3()
    mediPlatforms.forEach(mp => {
      mp._controlRing.getWorldPosition(cp);
      if (cp.projectOnPlane(up).distanceTo(PLAYER.model.position) < 0.65) {
        console.log(`Media Platform ${mp._mediaName}`)
        GameState.PlayerState = "INTERESTED";
        GameState.interationTargetPosition.copy(cp);
        activeMediaPlatform = mp;
        activeMediaPlatform.interactionStart();
      }
    })

    artworks.forEach(artwork => {
      let ip = new THREE.Vector3();
      artwork._interactionRing.getWorldPosition(ip);
      if (ip.projectOnPlane(up).distanceTo(PLAYER.model.position) < 0.7) {
        GameState.PlayerState = "INTERACTING"
        GameState.interationTargetPosition.copy(ip)
        PLAYER.motion.mousecapture = false;
        PLAYER.motion.mouseNormalX = PLAYER.motion.mouseNormalY = 0;
        hud.modal.container.classList.add('appear-grow');
        hud.modal.content.innerText = `Artwork: ${artowrk._firmname}, By: ${artowrk._message}`
      }
    })

    ads.forEach(ad => {
      let ip = new THREE.Vector3();
      ad._interactionRing.getWorldPosition(ip);
      if (taxicabDistance(ip,PLAYER.model.position ) < 2) {
        GameState.PlayerState = "INTERACTING"
        PLAYER.animationState = "idle";
        GameState.interationTargetPosition.copy(ip)
        PLAYER.motion.mousecapture = false;
        PLAYER.motion.mouseNormalX = PLAYER.motion.mouseNormalY = 0;
        hud.modal.container.classList.add('appear-grow');
        hud.modal.content.innerText = `Welcome to Aarohi'22 sponsored by: ${ad._firmname}, they say: ${ad._message}`
      }
    })
  }

  if (GameState.PlayerState == "INTERESTED") {
    if (PLAYER.model.position.distanceTo(GameState.interationTargetPosition) > 3.0) {
      GameState.PlayerState = "FREEROAM"
      if (activeMediaPlatform) {
        activeMediaPlatform.interactionPause();
        activeMediaPlatform = undefined;
        GameState.interationTargetPosition = new THREE.Vector3();
      }
    }
  }

  if (PLAYER.model.position.length() > 150) {
    PLAYER.model.position.set(0, 0, 0); 
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

// contentLoaded = true;
preloader.style.display = "none";

animate();
