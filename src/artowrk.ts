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

    _redirect: string;

    _firmname: string;
    _message: string;

    _generateInteraction: () => HTMLDivElement;

    constructor(firmName: string, message: string, adTexture: THREE.Texture, panelModel: THREE.Object3D, offset?: THREE.Vector3, redirect: string = '') {

        this._firmname = firmName;
        this._message = message;
        this._redirect = redirect;

        this._model = new THREE.Object3D()
        this.addBanner(adTexture, offset)

        const canvas = document.createElement('canvas');
        const text = this._firmname;
        canvas.width = 700;
        canvas.height = 100;
        const context = canvas.getContext('2d')!;
        context.fillStyle = "black"
        context.fillRect(0, 0, 700, 100)
        context.fill();
        context.font = "50px sans-serif"
        const textsize = context.measureText(text)
        context.fillStyle = "white"
        context.fillText(text, (700 - textsize.width) / 2, 50)
        const textTexture = new THREE.CanvasTexture(canvas)
        this.addBoard(textTexture);
        this.addPanel(panelModel)
        const interactionRing = new THREE.Mesh(
            interactionRingGeometry,
            interactionRingMatrial
        )
        interactionRing.rotateX(-Math.PI / 2)
        interactionRing.position.set(3.0, 0.5, 2);
        this._interactionRing = interactionRing;
        this._model.add(interactionRing)
        this._banner = new THREE.Object3D();
        this._generateInteraction = () => {
            const container = document.createElement('div');
            const paragraph = document.createElement('p');
            paragraph.innerText = 'Your Content Here';
            container.appendChild(paragraph);
            return container;
        }
    }

    async addBoard(texture: THREE.Texture) {
        let board = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(7, 1),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
            })
        )
        this._model.add(board);
        board.translateY(4);
        board.translateX(3);
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