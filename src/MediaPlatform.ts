import * as THREE from 'three'

const controlRingGeometry = new THREE.TorusBufferGeometry(0.5, 0.05, 36, 72);
const controlRingMaterial = new THREE.MeshBasicMaterial({
    color: 'gold'
})

export class MediaPlatform {
    _model: THREE.Object3D;
    _mediaName: string;
    _texture: THREE.Texture | THREE.VideoTexture
    
    _platformMesh: THREE.Object3D;
    _controlRing: THREE.Object3D;
    _screen: THREE.Object3D;

    _video: HTMLVideoElement;

    constructor(mediaName: string, platform: THREE.Object3D, video: HTMLVideoElement) {
        this._model = new THREE.Object3D();
        this._platformMesh = platform.clone();
        this._texture = new THREE.VideoTexture(video);
        this._video = video;
        this._screen = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(8, 4, 1, 1),
            new THREE.MeshBasicMaterial({
                map: this._texture,
                side: THREE.DoubleSide
            })
        )
        this._mediaName = mediaName;
        this._controlRing = new THREE.Mesh(
            controlRingGeometry,
            controlRingMaterial
        )
        this._controlRing.position.set(0, 0.5, -3);
        this._controlRing.rotateX(-Math.PI/2);
        this._screen.position.set(0, 1, 0);
        this._screen.rotateY(Math.PI);
        this._model.add(this._platformMesh)
        this._model.add(this._screen);
        this._model.add(this._controlRing);
    }

    setScreenOffset(offset: THREE.Vector3) {
        this._screen.position.copy(offset);
    }

    interactionStart() {
        if (this._video.paused || this._video.currentTime == 0) {
            this._video.play();
        }
    }

    interactionPause() {
        if (!this._video.paused) {
            this._video.pause();
        }
    }
}