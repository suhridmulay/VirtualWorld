import * as THREE from 'three';

export class Mob {
    model: THREE.Object3D;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;

    constructor(model: THREE.Object3D) {
        this.model = model;
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
    }

    controllerUpdate() {
        this.acceleration.set(2 * Math.random() - 0.5, 0, 2 * Math.random() - 0.5)
    }

    update() {
        this.velocity.add(this.acceleration.multiplyScalar(0.01))
        this.position.add(this.velocity.multiplyScalar(0.01))
        this.model.position.copy(this.position);
    }
}