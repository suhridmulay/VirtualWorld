import * as THREE from 'three';

export type Advert = {
    name: string,
    model: THREE.Object3D,
    position: THREE.Vector3
}

const advertTextureLoader = new THREE.TextureLoader();

const advertGeometryLarge = new THREE.PlaneBufferGeometry(1, 1);

export async function createAdvert(name: string, pathToLogo: string): Promise<Advert> {
    const adTexture = await advertTextureLoader.loadAsync(pathToLogo);
    console.log({w: adTexture.image.width, h: adTexture.image.height});
    const adVert = new THREE.Mesh(
        advertGeometryLarge,
        new THREE.MeshBasicMaterial({
            map: adTexture,
            transparent: false,
            side: THREE.DoubleSide
        })
    )
    adVert.name = name;
    return {
        name: name,
        model: adVert,
        position: new THREE.Vector3(0, 0, 0),
    } as Advert
}

export async function setAdvertPosition(advert: Advert, position: THREE.Vector3) {
    advert.model.position.copy(position);
    advert.position.copy(position);
}