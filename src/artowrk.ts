import * as THREE from 'three';

const bannerGeometry = new THREE.PlaneBufferGeometry(4, 2, 1, 1);

const interactionRingGeometry = new THREE.TorusBufferGeometry(0.5, 0.05, 36, 72)
const interactionRingMatrial = new THREE.MeshBasicMaterial({
    color: 'gold'
})

export class Artwork {
    _model: THREE.Object3D
    _interactionRing: THREE.Object3D;

    _banner: THREE.Object3D;

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
        interactionRing.rotateX(-Math.PI / 2)
        interactionRing.position.set(3.0, 0.5, 2);
        this._interactionRing = interactionRing;
        this._model.add(interactionRing)
        this._model.traverse(c => {
            if (c instanceof THREE.Mesh) {
                ((c as THREE.Mesh).material as THREE.Material).fog = false;
            }
        })
        this._banner = new THREE.Object3D();
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
                map: adTexture
            })
        )
        if (offset) {
            banner.position.copy(offset)
        }
        banner.name = this._firmname;
        this._banner = banner;
        this._model.add(this._banner);
    }

    // TODO
    changeTo(texture: THREE.Texture) {
        console.log(this._banner);
        ((this._banner as THREE.Mesh).material as THREE.MeshBasicMaterial).map = texture;
        ((this._banner as THREE.Mesh).material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
}