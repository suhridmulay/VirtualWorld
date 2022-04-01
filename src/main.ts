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


import { Advert } from './advert';
import { Artwork } from './artowrk';
import Hls from 'hls.js';
import { MediaPlatform } from './MediaPlatform';
import { TreasureHuntManager } from './treasure';
import { VideoController } from './videoController';
// import * as URLs from './URLS.json';


const playerModelUrl = 'res/models/avatar/source/eve.fbx';

const app = document.querySelector<HTMLDivElement>('#app')!
const preloader = document.querySelector<HTMLDivElement>('#preloader')!
const preloaderText = document.querySelector<HTMLHeadingElement>('#preloader > h1')!

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

const filesRoot = '' // 'https://d3hs3qv31vrl2x.cloudfront.net/public/'
const recordingsRoot = 'https://d3hs3qv31vrl2x.cloudfront.net/recordings/'

const mousePointer = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();

preloaderText.innerText = 'Loading Ground Textures!'

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

const renderer = new THREE.WebGLRenderer({
  logarithmicDepthBuffer: true,
  powerPreference: "high-performance"
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.sortObjects = true;
app.appendChild(renderer.domElement);

preloaderText.innerText = 'Started Renderer'

function taxicabDistance(v1: THREE.Vector3, v2: THREE.Vector3) {
  let d = Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z)
  return d
}

function inBetween(x: number, a: number, b: number): boolean {
  return (x > Math.min(a, b)) && (x < Math.max(a, b))
}

function insideQuad(currentPosition: THREE.Vector2, point1: THREE.Vector2, point2: THREE.Vector2): boolean {
  return inBetween(currentPosition.x, point1.x, point2.x) && inBetween(currentPosition.y, point1.y, point2.y)
}

const validArea1Corners = [new THREE.Vector2(-20, -80), new THREE.Vector2(20, 40)]
const validArea2Corners = [new THREE.Vector2(-60, -40), new THREE.Vector2(60, 130)]
const entrancePanelCorners = [new THREE.Vector2(-6, -72.5), new THREE.Vector2(4, -67.5)]
const oatEntrance = [new THREE.Vector2(8, 60), new THREE.Vector2(10, 80)]
const oatCenter = new THREE.Vector2(9.4, 94.25);
const oatInnerRadius = 17.79;
const oatOuterRadius = 30.65;

function isPlayerPositionValid(currentPlanePosition: THREE.Vector2): boolean {
  return (
    (insideQuad(currentPlanePosition, validArea1Corners[0], validArea1Corners[1])
      || insideQuad(currentPlanePosition, validArea2Corners[0], validArea2Corners[1]))
    && (!insideQuad(currentPlanePosition, entrancePanelCorners[0], entrancePanelCorners[1]))
    && (
      !inBetween(currentPlanePosition.distanceTo(oatCenter), oatInnerRadius, oatOuterRadius)
      || insideQuad(currentPlanePosition, oatEntrance[0], oatEntrance[1])
      || currentPlanePosition.y > 94
    )

  )
}

// Initialise an effect composer
const composer = new EffectComposer(renderer);

// Create a player object and setup the camera
const PLAYER = new Player({ FOV: 70, aspect: window.innerWidth / window.innerHeight, near: 0.1, far: 1000 }, 'Forest');
PLAYER.camera.position.set(0, 1, 0);

preloaderText.innerText = 'Generated Player Object';

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
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.02);

const marbleTexture = await textureLoader.loadAsync(`${filesRoot}res/textures/marble/Marble021_1K_Color.jpg`);
marbleTexture.wrapS = marbleTexture.wrapT = THREE.MirroredRepeatWrapping;
marbleTexture.repeat.set(1, 1);
const marbleRoughnessTexture = await textureLoader.loadAsync(`${filesRoot}res/textures/marble/Marble021_1K_Roughness.jpg`);

const whiteMarbleMaterial = new THREE.MeshStandardMaterial({
  map: marbleTexture,
  roughnessMap: marbleRoughnessTexture,
  side: THREE.DoubleSide
})

// Adding a charachter mesh for the player to follow
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

preloaderText.innerHTML = 'Interactions Initialised'

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

// Adding a ground
const groundGeometry = new THREE.PlaneBufferGeometry(400, 400, 1, 1)
const groundPlane = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshStandardMaterial({
    // map: grassTexture,
    // normalMap: grassNormal,
    color: 0x0a0a0a,
    transparent: true,
    opacity: 0.89
  })
)
const groundMirror = new Reflector(
  groundGeometry,
  {
    clipBias: 0.01
  }
)
scene.add(groundMirror)
groundMirror.rotateX(-Math.PI / 2);
groundMirror.position.y -= 0.01;
groundPlane.rotateX(-Math.PI / 2);
scene.add(groundPlane);

// Create a skyball
const skyball = new THREE.Mesh(
  new THREE.SphereBufferGeometry(400, 40, 40),
  new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    fog: true,
    side: THREE.BackSide
  })
)
skyball.name = "skyball";
scene.add(skyball);

// Loading logo and theme extrude
const entrancePanel = new THREE.Object3D()
const entrancePanelBaseGeometry = new THREE.BoxBufferGeometry(10, 0.3, 5)
const entrancePanelBase = new THREE.Mesh(
  entrancePanelBaseGeometry,
  whiteMarbleMaterial
)

const entrancePanelBannerGeometry = new THREE.PlaneBufferGeometry(8, 3, 1, 1)
const entrancePanelBannerTexture = await textureLoader.loadAsync(`${filesRoot}res/backgrounds/logo-black.jpg`)
const renderTarget = new THREE.WebGLCubeRenderTarget(256)
const entranceReflectionCamera = new THREE.CubeCamera(0.1, 1000, renderTarget)
entranceReflectionCamera.rotateZ(Math.PI / 2);
const entrancePanelBanner = new THREE.Mesh(
  entrancePanelBannerGeometry,
  new THREE.MeshStandardMaterial({
    map: entrancePanelBannerTexture,
    bumpMap: entrancePanelBannerTexture,
    bumpScale: 0.2,
    side: THREE.DoubleSide,
    transparent: true,
    color: 'white',
    metalness: 0.8,
    envMap: renderTarget.texture,
    roughness: 0.2,
  })
)
entrancePanelBanner.add(entranceReflectionCamera)
entrancePanel.add(entrancePanelBanner)
entrancePanelBanner.rotateY(Math.PI)
entrancePanelBanner.position.y += 1.8

entrancePanel.add(entrancePanelBase)
scene.add(entrancePanel)
entrancePanel.position.set(-1, 0, -70)

function loadLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
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

preloaderText.innerText = 'Lighting the Scene'

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
const adPanel = await gltfLoader.loadAsync(`${filesRoot}res/models/misc/Spons Panel.glb`);
adPanel.scene.scale.setScalar(0.001);
for (let adv of adURLs) {
  const adTexture = await textureLoader.loadAsync(`${filesRoot}${adBasePath}${adv.path}`);
  const ad = new Advert(adv.firm, adv.message, adTexture, adPanel.scene, new THREE.Vector3(1.375, 1.375, 0.01), `${filesRoot}${adBasePath}${adv.path}`)
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
preloaderText.innerText = 'To our gracious sponsors'

// Artwork
let interactions: Artwork[] = []
const artworkPanel = await fbxLoader.loadAsync(`${filesRoot}res/models/misc/Display Panels.fbx`);
const timelineTexture = await textureLoader.loadAsync('res/backgrounds/piyush-piyush-website.png');
artworkPanel.scale.setScalar(0.001);
const artowrk = new Artwork("Timeline", "", timelineTexture, artworkPanel, new THREE.Vector3(3.1875, 1.5, -1));
artowrk._generateInteraction = () => {
  const container = document.createElement('div');
  container.style.height = "100%";
  container.style.width = "100%";
  const img = document.createElement('img');
  img.src = `${filesRoot}/res/backgrounds/final-schedule-1.png`;
  img.style.maxWidth = "100%";
  img.style.objectFit = "cover";
  const imgContainer = document.createElement('div');
  imgContainer.style.width = "100%";
  imgContainer.style.height = "100%";
  imgContainer.style.overflow = "scroll";
  imgContainer.appendChild(img);
  container.appendChild(imgContainer);

  container.style.overflow = "hidden";
  return container;
}
interactions.push(artowrk)
scene.add(artowrk._model);
artowrk._model.rotateY(Math.PI / 2);
artowrk._model.position.set(-10, 0, 0);

// Redirection Props
const platformData = [
  {
    name: 'instagram',
    url: 'https://www.instagram.com/aarohi_vnitnagpur/?hl=en',
    texture: await textureLoader.loadAsync(`${filesRoot}res/backgrounds/INSTA.jpg`)
  },
  {
    name: 'facebook',
    url: 'https://www.facebook.com/AarohiWorld/',
    texture: await textureLoader.loadAsync(`res/backgrounds/FB.jpg`)
  },
  {
    name: 'youtube',
    url: 'https://www.youtube.com/channel/UCcBmZqk4hUSbSiyQzGU20pg',
    texture: await textureLoader.loadAsync(`res/backgrounds/YOUTUBE.jpg`)
  }
]
let redirectionPlatforms: Artwork[] = [];
let pz = -60
platformData.forEach(pd => {
  const artstation = new Artwork(pd.name, pd.name, pd.texture, artworkPanel, new THREE.Vector3(3.1875, 1.5, -1));
  artstation._redirect = pd.url;
  scene.add(artstation._model);
  artstation._model.position.set(10, 0, pz);
  artstation._model.rotateY(5 * Math.PI / 4);
  redirectionPlatforms.push(artstation);
  pz += 10;
})
preloaderText.innerText = 'Connecting Our Social Media'
const eventPlatformData = [
  {
    name: 'Shutterbug',
    url: 'https://aarohiworld.org/exhibitions/shutterbug',
    texture: await textureLoader.loadAsync(`${filesRoot}res/backgrounds/shutterbug.jpg`)
  },
  {
    name: 'Art Conoscenza',
    url: 'https://aarohiworld.org/exhibitions/',
    texture: await textureLoader.loadAsync(`res/backgrounds/art-cono.jpg`)
  }
]
let epz = -55
eventPlatformData.forEach(epd => {
  const eventPlatform = new Artwork(epd.name, epd.name, epd.texture, artworkPanel, new THREE.Vector3(3.1875, 1.5, -1))
  eventPlatform._redirect = epd.url;
  scene.add(eventPlatform._model);
  eventPlatform._model.position.set(-10, 0, epz);
  eventPlatform._model.rotateY(3 * Math.PI / 4);
  redirectionPlatforms.push(eventPlatform);
  epz += 10;
})

const pst = await textureLoader.loadAsync(`${filesRoot}res/backgrounds/piyush-sharma-fir-website.png`)
const standupPlatform = new Artwork("StandUp Nite", "Aarohi 2022", pst, artworkPanel, new THREE.Vector3(3.1875, 1.5, -1))
standupPlatform._model.position.set(5, 0, 15);
standupPlatform._model.rotateY(Math.PI);
standupPlatform._generateInteraction = () => {
  const container = document.createElement('div');
  container.style.width = "100%";
  container.style.height = "100%";
  const formContainer = document.createElement('div');
  formContainer.style.display = "flex";
  formContainer.style.justifyContent = "center";
  formContainer.style.width = "100%";
  formContainer.style.height = "100%";
  container.style.overflow = "hidden";
  formContainer.style.overflow = "scroll"
  if ((new Date()).getHours() >= 20) {
    const message = document.createElement('p');
    message.innerText = 'Better Luck Next Time!'
    formContainer.appendChild(message)
  } else {
    const formFrame = document.createElement('iframe');
    formFrame.width = "640px";
    formFrame.height = "2500px"
    const formEmbedLink = 'https://docs.google.com/forms/d/e/1FAIpQLScRLaQ9-gjq4Q_8H48_8a7Km-bHLBE1D1iti48rH56j0kI33Q/viewform?embedded=true';
    formFrame.src = formEmbedLink;
    formContainer.appendChild(formFrame)
  }
  container.appendChild(formContainer)
  return container;
}
scene.add(standupPlatform._model)
interactions.push(standupPlatform);

// Spheres
const sphereGeometry = new THREE.SphereBufferGeometry(1, 8, 8);
const sphereMaterial = new THREE.MeshBasicMaterial({
  color: 'orangered'
})
const INSTANCE_COUNT = 200;
const sphereInstances = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, INSTANCE_COUNT)
const sphereTransfromDummy = new THREE.Object3D()
for (let i = 0; i < INSTANCE_COUNT; i++) {
  sphereTransfromDummy.position.set(
    (Math.random() * 2 - 1) * 100,
    5 + 5 * Math.random(),
    (Math.random() * 2 - 1) * 100
  );
  sphereTransfromDummy.scale.setScalar(Math.random());
  sphereTransfromDummy.updateMatrix();
  sphereInstances.setMatrixAt(i, sphereTransfromDummy.matrix)
}
scene.add(sphereInstances);

// Vegetation
const bushModel = await gltfLoader.loadAsync(`${filesRoot}res/models/props/bush.glb`);
const bush = bushModel.scene;
bush.scale.setScalar(0.005);

const bushInstances = new THREE.InstancedMesh(
  (bush.children[0].children[0] as THREE.Mesh).geometry,
  (bush.children[0].children[0] as THREE.Mesh).material,
  200
)
const R = 30;
const transfromDummy = new THREE.Object3D();
for (let i = 0; i < 100; i++) {
  const theta = Math.random() * 2 * Math.PI;
  const offset = (Math.random()) * 30
  transfromDummy.position.set(
    (R + offset) * Math.cos(theta),
    0.5 * 0.5 * Math.random(),
    (R + offset) * Math.sin(theta)
  )
  transfromDummy.scale.setScalar(0.25 + Math.random() * 0.25);
  transfromDummy.updateMatrix();
  bushInstances.setMatrixAt(i, transfromDummy.matrix);
}
scene.add(bushInstances);

preloaderText.innerText = 'Putting Treasures for you'


// Hobo
const hobo = new THREE.Object3D()
const hoboModel = await gltfLoader.loadAsync(`${filesRoot}res/models/misc/Hobo.glb`);

hoboModel.scene.traverse(c => {
  if (c instanceof THREE.Mesh) {
    (c as THREE.Mesh).material = whiteMarbleMaterial
  }
})

hoboModel.scene.scale.setScalar(0.001);
const hoboBaseGeometry = new THREE.CylinderBufferGeometry(3, 3, 0.3, 72, 1);
const hoboBase = new THREE.Mesh(hoboBaseGeometry, whiteMarbleMaterial);
hobo.add(hoboBase);
hobo.add(hoboModel.scene);
scene.add(hobo);
hobo.position.set(0, 0, -20);
const sound = new THREE.PositionalAudio(PLAYER.audioListener);
const audioLoader = new THREE.AudioLoader()
let buffer = await audioLoader.loadAsync(`${filesRoot}res/audio/Aarohi final song.mp3`);
sound.setBuffer(buffer);
hobo.add(sound);
sound.play();
sound.loop = true;
sound.setVolume(4.0);

preloaderText.innerText = 'Playing the Universal Symphony'


// Dome
const domeModel = await gltfLoader.loadAsync(`${filesRoot}res/models/misc/Dome 2.glb`)
const dome = domeModel.scene;
dome.scale.setScalar(1.5)
dome.position.y -= 0.5;
scene.add(dome)
preloaderText.innerText = 'Structuring The World'

//oat 
const oatModel = await gltfLoader.loadAsync(`${filesRoot}res/models/misc/OAT.glb`)
const oatContainer = new THREE.Object3D();
const oat = oatModel.scene;
oatContainer.add(oat)
oat.position.y += 0.1
oat.position.x += 70;
oat.position.z += 50
oatContainer.rotateY(3 * (Math.PI) / 2)
oatContainer.position.z += 60
oatContainer.position.x += 30;
scene.add(oatContainer)
preloaderText.innerText = 'Setting the Stage'
const oatPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(16, 9),
  new THREE.MeshBasicMaterial({
    map: await textureLoader.loadAsync(`${filesRoot}res/backgrounds/OAT.png`),
    side: THREE.DoubleSide
  })
)
scene.add(oatPlane)
oatPlane.rotateY(Math.PI);
oatPlane.rotateY(Math.PI / 4);
oatPlane.position.set(20, 3, 50);

oat.traverse(c => {
  if (c instanceof THREE.Mesh) {
    (c.material as THREE.MeshBasicMaterial).color = new THREE.Color('lightgray');
  }
})

// Showcase stage for sponsors or movies
// Livestream jama lo bas, This thing is gold
const showcase = new THREE.Object3D();
const showcaseStageMaterial = whiteMarbleMaterial;
const showcasePlatform = new THREE.Mesh(
  new THREE.BoxBufferGeometry(8, 0.3, 4),
  showcaseStageMaterial
);
showcase.add(showcasePlatform);
const showcaseVideo = document.createElement('video');
showcaseVideo.crossOrigin = "anonymous";
let videoSource = 'http://117.205.13.247/stream/stream.m3u8' //'https://cph-msl.akamaized.net/hls/live/2000341/test/master.m3u8';
if (Hls.isSupported()) {
  let hls = new Hls();
  hls.loadSource(videoSource);
  hls.attachMedia(showcaseVideo)
}

// Media Platforms
const prerecordedVideo = document.createElement('video');
prerecordedVideo.crossOrigin = "anonymous";
const videoController = new VideoController(prerecordedVideo)
videoController.schedule(new Date(2022, 3, 1, 6, 30), "res/media/tj.mp4")
videoController.schedule(new Date(2022, 2, 31, 2, 35), "b")
videoController.schedule(new Date(2022, 2, 31, 2, 40), "c")
videoController.schedule(new Date(2022, 2, 31, 2, 45), "d")
videoController.schedule(new Date(2022, 3, 31, 2, 50), "e")
const mediaPlatforms: MediaPlatform[] = [];
const mediaPlatformBase = showcasePlatform.clone();
const scheduledVid = videoController.getScheduledVideo()
console.log(scheduledVid)
prerecordedVideo.src = scheduledVid.src;
const delta = (new Date()).getTime() - scheduledVid.time.getTime()
if (delta > 0 && delta < prerecordedVideo.duration) {
  prerecordedVideo.currentTime = delta / 1000
  console.log(delta / 1000)
}
const mediaPlatform = new MediaPlatform('kochikame', mediaPlatformBase, prerecordedVideo)
mediaPlatforms.push(mediaPlatform);
mediaPlatform._model.translateZ(15);
mediaPlatform._model.translateX(-5);
// scene.add(mediaPlatform._model)


const liveVideoPlatform = new MediaPlatform('lvp', mediaPlatformBase, showcaseVideo)
mediaPlatforms.push(liveVideoPlatform)
// scene.add(liveVideoPlatform._model)
liveVideoPlatform._model.position.set(5, 0, 15);
preloaderText.innerText = 'Loading Stellar Performances'

const themeRevealVideo = document.createElement('video');
themeRevealVideo.loop = true;
themeRevealVideo.crossOrigin = "anonymous"
themeRevealVideo.src = `${recordingsRoot}Aarohi22++VNIT+Nagpur++Official+Theme+Release+Video_1080p.mp4`
const themeRevealPlatform = new MediaPlatform('reveal', mediaPlatformBase, themeRevealVideo);
scene.add(themeRevealPlatform._model);
themeRevealPlatform._model.translateZ(90);
themeRevealPlatform._model.translateX(10);
mediaPlatforms.push(themeRevealPlatform);

// Treasure Hunt
const treasureModel = await fbxLoader.loadAsync(`${filesRoot}res/models/decor/Chest_Gold.fbx`);
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
  const R0 = 30;
  const offset = 30 * Math.random();
  const theta = Math.random() * 2 * Math.PI;
  const coords = new THREE.Vector3(
    (R0 + offset) * Math.cos(theta),
    0,
    (R0 + offset) * Math.sin(theta)
  );
  if (GameState.PlayerState == "FREEROAM") {
    treasureHuntManager.spawnTreasure(scene, treasure, coords);
    hud.modal.container.classList.add('appear-grow');
    hud.modal.content.innerText = "A Treasure has spawned on the map, be the first to reveal it and send to @aarohi_vnitnagpur for a chance to win exciting prizes";
    GameState.PlayerState = "INTERACTING";
    GameState.interationTargetPosition.copy(PLAYER.model.position);
  }
}
const treasureSpawnTimeout = 1000 * 60 * (2 + Math.random());
setTimeout(treasureSpawn, treasureSpawnTimeout);

preloaderText.innerText = 'Almost Done!'

// Walls
const wallShape = new THREE.Shape();
wallShape.moveTo(0, 0);
wallShape.lineTo(-20, 0);
wallShape.lineTo(-20, 40);
wallShape.lineTo(-60, 40);
wallShape.lineTo(-60, 210);
wallShape.lineTo(60, 210);
wallShape.lineTo(60, 40);
wallShape.lineTo(20, 40);
wallShape.lineTo(20, 0);
const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {
  depth: 35,
})
const wallMaterial = whiteMarbleMaterial;
const walls = new THREE.Mesh(wallGeometry, wallMaterial);
walls.rotateX(Math.PI / 2)
walls.translateZ(-30);
walls.translateY(-80);
scene.add(walls);

// WCL Adverts
const adGeometry = new THREE.PlaneBufferGeometry(6, 3);
const wclMaterial = new THREE.MeshBasicMaterial({
  map: await textureLoader.loadAsync(`${filesRoot}${adBasePath}wcl.png`),
  transparent: true
})
const wclInstances = new THREE.InstancedMesh(adGeometry, wclMaterial, 30);
for (let i = 0; i < 30; i++) {
  let row = Math.floor(i / 10);
  let col = i % 10
  transfromDummy.position.set(
    ((i % 2) * 2 - 1) * 60,
    1 + row * 2,
    col * 4 + (row % 2) * 2 - 4
  )
  transfromDummy.rotation.y = (((i % 2) * 2 - 1) * -Math.PI / 2)
  transfromDummy.updateMatrix();
  wclInstances.setMatrixAt(i, transfromDummy.matrix)
}

const dharampethMahilaBankMaterial = new THREE.MeshBasicMaterial({
  map: await textureLoader.loadAsync(`${filesRoot}${adBasePath}mahila.png`),
  transparent: true
})
const dmbInstances = new THREE.InstancedMesh(adGeometry, dharampethMahilaBankMaterial, 30);
for (let i = 0; i < 30; i++) {
  let row = Math.floor(i / 10);
  let col = i % 10
  transfromDummy.position.set(
    ((i % 2) * 2 - 1) * 60,
    1 + row * 2,
    col * 4 + (row % 2) * 2
  )
  transfromDummy.rotation.y = (((i % 2) * 2 - 1) * -Math.PI / 2)
  transfromDummy.updateMatrix();
  dmbInstances.setMatrixAt(i, transfromDummy.matrix)
}
scene.add(dmbInstances);
scene.add(wclInstances);

// Setup mouse interactions
document.addEventListener('click', (e) => {
  mousePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePointer, PLAYER.camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  console.log(intersects);

  if (intersects.length > 0) {
    if (intersects[0].object.name == "treasure") {
      const message = treasureHuntManager.findTreasure();
      hud.modal.container.classList.add('appear-grow');
      hud.modal.content.appendChild(message);
      GameState.PlayerState = "INTERACTING";
      GameState.interationTargetPosition.copy(PLAYER.model.position);
      scene.remove(treasure);
      setTimeout(treasureSpawn, 1000 * 60 * (10 + 2 * Math.random()));
    }
  }
})

let activeMediaPlatform: MediaPlatform | undefined = undefined;
function gameUpdate(deltaT: number) {
  deltaT;

  const up = new THREE.Vector3(0, 1, 0);

  // Rotate hobo model
  hobo.rotateY(2 * Math.PI / 240);

  // Rotate interaction rings for media platforms
  mediaPlatforms.forEach(mp => {
    mp._controlRing.rotation.x = -Math.PI / 2 + 0.25 * Math.cos(worldClock.getElapsedTime() * 2)
    mp._controlRing.rotation.y = 0.25 * Math.sin(worldClock.getElapsedTime() * 2)
  })


  if (GameState.PlayerState == "FREEROAM") {

    if (!sound.isPlaying) {
      sound.play();
    }

    let cp = new THREE.Vector3()
    mediaPlatforms.forEach(mp => {
      mp._controlRing.getWorldPosition(cp);
      if (cp.projectOnPlane(up).distanceTo(PLAYER.model.position) < 0.65) {
        GameState.PlayerState = "INTERESTED";
        GameState.interationTargetPosition.copy(cp);
        activeMediaPlatform = mp;
        activeMediaPlatform.interactionStart();
      }
    })

    interactions.forEach(interaction => {
      let ip = new THREE.Vector3();
      interaction._interactionRing.getWorldPosition(ip);
      if (ip.projectOnPlane(up).distanceTo(PLAYER.model.position) < 0.6) {
        GameState.PlayerState = "INTERACTING"
        GameState.interationTargetPosition.copy(ip)
        PLAYER.motion.mousecapture = false;
        PLAYER.motion.mouseNormalX = PLAYER.motion.mouseNormalY = 0;
        hud.modal.container.classList.add('appear-grow');
        hud.modal.content.appendChild(interaction._generateInteraction())
      }
    })

    redirectionPlatforms.forEach(rp => {
      let ip = new THREE.Vector3();
      rp._interactionRing.getWorldPosition(ip);
      if (ip.projectOnPlane(up).distanceTo(PLAYER.model.position) < 0.6) {
        GameState.PlayerState = "INTERESTED";
        GameState.interationTargetPosition.copy(ip);
        window.open(rp._redirect, '_blank')
        PLAYER.resetMotionState()
      }
    })

    ads.forEach(ad => {
      let ip = new THREE.Vector3();
      ad._interactionRing.getWorldPosition(ip);
      if (taxicabDistance(ip, PLAYER.model.position) < 2) {
        GameState.PlayerState = "INTERACTING"
        PLAYER.animationState = "idle";
        GameState.interationTargetPosition.copy(ip)
        PLAYER.motion.mousecapture = false;
        PLAYER.motion.mouseNormalX = PLAYER.motion.mouseNormalY = 0;
        hud.modal.container.classList.add('appear-grow');
        hud.modal.content.appendChild(ad.createContent())
      }
    })
  }

  if (GameState.PlayerState == "INTERESTED") {
    if (sound.isPlaying) {
      sound.pause()
    }

    if (PLAYER.model.position.distanceTo(GameState.interationTargetPosition) > 3.0) {
      GameState.PlayerState = "FREEROAM"
      if (activeMediaPlatform) {
        activeMediaPlatform.interactionPause();
        activeMediaPlatform = undefined;
        GameState.interationTargetPosition = new THREE.Vector3();
      }
    }
  }

  if (GameState.PlayerState == "INTERACTING") {
    if (sound.isPlaying) {
      sound.pause()
    }
  }

  if (PLAYER.model.position.length() > 150) {
    PLAYER.model.position.set(0, 0, 0);
  }
}

function propsUpdate() {
  sphereInstances.rotateY((2 * Math.PI / 2400));
}

function update() {
  if (GameState.PlayerState != "INTERACTING") {
    const oldPlayerPosition = PLAYER.model.position.clone()
    const oldPlayerRotation = PLAYER.model.rotation.clone();
    const oldCameraPosition = PLAYER.camera.position.clone();
    PLAYER.update(worldClock.getDelta());
    const playerPlanePosition = new THREE.Vector2(PLAYER.model.position.x, PLAYER.model.position.z)
    if (!isPlayerPositionValid(playerPlanePosition)) {
      PLAYER.model.position.copy(oldPlayerPosition);
    }
    const cameraWorldPosition = new THREE.Vector3();
    PLAYER.camera.getWorldPosition(cameraWorldPosition);
    const cameraPlanePosition = new THREE.Vector2(cameraWorldPosition.x, cameraWorldPosition.z)
    if (!isPlayerPositionValid(cameraPlanePosition)) {
      PLAYER.model.rotation.copy(oldPlayerRotation);
    }
  }

  hud.location.innerText = `(${PLAYER.model.position.x.toFixed(2)}, ${PLAYER.model.position.y.toFixed(2)}, ${PLAYER.model.position.z.toFixed(2)})`
  propsUpdate();
  gameUpdate(worldClock.getDelta());
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
PLAYER.model.position.set(0, 0, -78)
PLAYER.model.rotateY(Math.PI)
preloader.style.display = "none";
entranceReflectionCamera.update(renderer, scene);

animate();
