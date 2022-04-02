import * as THREE from 'three';

const bannerGeometry = new THREE.PlaneBufferGeometry(2, 1, 1, 1);

const interactionRingGeometry = new THREE.TorusBufferGeometry(2, 0.05, 36, 4)
const interactionRingMatrial = new THREE.MeshBasicMaterial({
    color: 'orange'
})

export class Advert {
    _model: THREE.Object3D
    _interactionRing: THREE.Object3D;

    _firmname: string;
    _message: string;

    _image: string;

    constructor(firmName: string, message: string, adTexture: THREE.Texture, panelModel: THREE.Object3D, offset?: THREE.Vector3, image?: string) {

        this._firmname = firmName;
        this._message = message;
        if (image) {
            this._image = image;
        } else {
            this._image = '';
        }

        this._model = new THREE.Object3D()
        this.addBanner(adTexture, offset)
        this.addPanel(panelModel)
        const interactionRing = new THREE.Mesh(
            interactionRingGeometry,
            interactionRingMatrial
        )
        interactionRing.rotateX(-Math.PI / 2)
        interactionRing.rotateZ(Math.PI/4)
        interactionRing.position.set(1.375, 0.0, 2);
        this._interactionRing = interactionRing;
        this._model.add(interactionRing)
    }

    createContent() {
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.background = "#87CEEB" // `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.overflow = "scroll";
        const img = document.createElement('img');
        const para = document.createElement('p');
        img.style.objectFit = "cover";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.src = this._image;
        para.innerText =`'Welcome to Aarohi'22 sponsored by ${this._firmname}`
        para.style.textAlign = "center";
        para.style.fontSize = "1.2em";
        container.appendChild(img);
        container.appendChild(para);
        return container;
    }

    async addPanel(panel: THREE.Object3D) {
        this._model.add(panel.clone());
    }

    addBanner(adTexture: THREE.Texture, offset?: THREE.Vector3) {
        const banner = new THREE.Mesh(
            bannerGeometry,
            new THREE.MeshBasicMaterial({
                map: adTexture,
                color: 0xf0f0f0,
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