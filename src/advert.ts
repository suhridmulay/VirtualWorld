import * as THREE from 'three';

const bannerGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

const interactionRingGeometry = new THREE.TorusBufferGeometry(0.5, 0.05, 72, 36)
const interactionRingMatrial = new THREE.MeshBasicMaterial({
    color: 'gold'
})

export class Advert {
    _model: THREE.Object3D
    _interactionRing: THREE.Object3D;

    _firmname: string;
    _message: string;

    constructor(firmName: string, message: string, adTexture: THREE.Texture, panelModel: THREE.Object3D, offset?: THREE.Vector3) {

        this._firmname = firmName;
        this._message = message;

        this._model = new THREE.Object3D()
        this.addBanner(adTexture, offset)
        this.addPanel(panelModel)
        const interactionRing = new THREE.Mesh(
            interactionRingGeometry,
            interactionRingMatrial
        )
        interactionRing.rotateX(-Math.PI/2)
        interactionRing.position.set(1.375, 0.5, 2);
        this._interactionRing = interactionRing;
        this._model.add(interactionRing)
    }

    update() {
        
    }

    async addPanel(panel: THREE.Object3D) {
        this._model.add(panel.clone());
    }

    addBanner(adTexture: THREE.Texture, offset?: THREE.Vector3) {
        const banner = new THREE.Mesh(
            bannerGeometry,
            new THREE.MeshBasicMaterial({
                map: adTexture,
                transparent: true
            })
        )
        banner.name = this._firmname;
        if (offset) {
            banner.position.copy(offset)
        }
        this._model.add(banner)
    }
}