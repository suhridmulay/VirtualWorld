import * as THREE from "three";

interface CameraConfig {
    FOV: number;
    aspect: number;
    near: number;
    far: number;
}

interface MotionState {
    forward: boolean;
    left: boolean;
    reverse: boolean;
    right: boolean;
    speed: boolean;
    mouseNormalX: number;
    mouseNormalY: number;
    mousecapture: boolean,
}

export class Player {
    // Player camera
    // Forms the eyes of the player
    camera: THREE.PerspectiveCamera;
    // Model is the thee js container object
    // This will hold any player mesh we want to pass to it
    model: THREE.Object3D;
    // Motion stores the state of motion of the player
    motion: MotionState;
    // Velocity stores the player's speed
    velocity: number;
    // Position stores the current position of the player
    position: THREE.Vector3;
    // Acceleration
    acceleration: number;
    decceleration: THREE.Vector3;
    // Animation state stores current animation of the player
    // Determines which animation will be played when
    animationState: string;
    location: string;

    lookSpeedX: number
    lookSpeedY: number

    constructor({ FOV, aspect, near, far }: CameraConfig, location: string) {
        this.camera = new THREE.PerspectiveCamera(FOV, aspect, near, far);
        this.camera.name = "PlayerCam";
        this.model = new THREE.Object3D();
        this.model.add(this.camera);
        const mesh = new THREE.Object3D();
        mesh.name = "PlayerMesh";
        mesh.position.y += 0.5;
        this.model.add(mesh);
        this.position = new THREE.Vector3(0, 0, 0);
        this.motion = {
            forward: false,
            left: false,
            reverse: false,
            right: false,
            speed: false,
            mouseNormalX: 0,
            mouseNormalY: 0,
            mousecapture: false,
        };
        this.velocity = 0;
        this.animationState = "idle";
        this.location = location;
        this.initControls();
        this.lookSpeedX = this.lookSpeedY = 0.05;
        this.acceleration = 2;
        this.decceleration = new THREE.Vector3();
    }

    setCameraPosition(position: THREE.Vector3) {
        this.camera.position.copy(position);
    }

    addModel(model: THREE.Object3D) {
        this.model.getObjectByName("PlayerMesh")?.add(model);
    }

    initControls() {
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "w": case "W":
                    this.motion.forward = true;
                    this.animationState = "accelerating";
                    break;
                case "a": case "A":
                    this.motion.left = true;
                    break;
                case "s": case "S":
                    this.motion.reverse = true;
                    this.animationState = "decelerating";
                    break;
                case "d": case "D":
                    this.motion.right = true;
                    break;
                case "Shift":
                    this.motion.speed = true;
                    break;
            }
        });

        document.addEventListener('keypress', (e) => {
            switch (e.key) {
                case "c":
                    this.motion.mousecapture = !this.motion.mousecapture;
                    this.motion.mouseNormalX = 0;
                    this.motion.mouseNormalY = 0;
            }
        })

        document.addEventListener("keyup", (e) => {
            switch (e.key) {
                case "w": case "W":
                    this.motion.forward = false;
                    this.animationState = "idle";
                    break;
                case "a": case "A":
                    this.motion.left = false;
                    break;
                case "s": case "S":
                    this.motion.reverse = false;
                    this.animationState = "idle";
                    break;
                case "d": case "D":
                    this.motion.right = false;
                    break;
                case "Shift":
                    this.motion.speed = false;
            }
        });

        document.addEventListener("pointermove", (e) => {
            if (this.motion.mousecapture) {
                const normalisedX = ( e.clientX / window.innerWidth ) * 2 - 1;
                const normalisedY = - ( e.clientY / window.innerHeight ) * 2 + 1;
                console.log({normalisedX, normalisedY});
                this.motion.mouseNormalX = -normalisedX;
                this.motion.mouseNormalY = normalisedY;
            }
        });

        document.addEventListener('touchstart', (_) => {
            this.lookSpeedX = this.lookSpeedY = 3e-5;
        })

        document.addEventListener('mousedown', () => {
            this.motion.mousecapture = true;
        })

        document.addEventListener('mouseup', () => {
            this.motion.mousecapture = false;
        })
    }

    motionUpdate(deltaT: number) {

        let acc = this.acceleration;

        if (this.motion.speed) {
            acc *= 2;
        }

        if (this.motion.forward) {
            this.velocity += acc * deltaT;
        }
        if (this.motion.left) {
            this.model.rotateY(2 * deltaT);
        }
        if (this.motion.right) {
            this.model.rotateY(-2 * deltaT);
        }
        if (this.motion.reverse) {
            this.velocity -= acc * deltaT;
        }

        let rotataeXQuaternion = new THREE.Quaternion();
        let rotataeYQuaternion = new THREE.Quaternion();
        rotataeXQuaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            this.motion.mouseNormalX * this.lookSpeedX
        );
        rotataeYQuaternion.setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            this.motion.mouseNormalY * 0.3
        );
        this.model.applyQuaternion(rotataeXQuaternion);
        this.camera.quaternion.slerp(rotataeYQuaternion, 0.05);
    }

    animate() {
        const playerMesh = this.model.getObjectByName("PlayerMesh")!;
        switch (this.animationState) {
            case "accelerating": {
                const movementTarget = new THREE.Quaternion();
                movementTarget.setFromAxisAngle(
                    new THREE.Vector3(1, 0, 0),
                    -Math.PI / 6
                );
                playerMesh.quaternion.slerp(movementTarget, 0.1);
                break;
            }
            case "decelerating": {
                const movementTraget = new THREE.Quaternion();
                movementTraget.setFromAxisAngle(
                    new THREE.Vector3(1, 0, 0),
                    Math.PI / 6
                );
                playerMesh.quaternion.slerp(movementTraget, 0.1);
                break;
            }
            case "idle": {
                const movementTraget = new THREE.Quaternion();
                movementTraget.setFromAxisAngle(
                    new THREE.Vector3(1, 0, 0),
                    0
                );
                playerMesh.quaternion.slerp(movementTraget, 0.1);
                break;
            }
        }
    }

    update(deltaT: number) {
        this.motionUpdate(deltaT);
        this.animate();
        this.model.translateZ(-this.velocity);
        this.velocity *= 0.8;
    }
}
