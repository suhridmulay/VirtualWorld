interface MotionDescriptor {
    forward: boolean,
    reverse: boolean,
    left: boolean,
    right: boolean
}

export class MovementController<T> {
    target: T;
    motionDescriptor: MotionDescriptor;

    constructor(target: T) {
        this.target = target;
        this.motionDescriptor = {
            forward: false, reverse: false,
            left: false, right: false
        }
    }

    // Registers event listeners for wasd controls
    registerMovementController() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'w':
                    this.motionDescriptor.forward = true;
                    break;
                case 'a':
                    this.motionDescriptor.left = true;
                    break;
                case 's':
                    this.motionDescriptor.reverse = true;
                    break;
                case 'd':
                    this.motionDescriptor.right = true;
                    break;
            }
        })

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'w':
                    this.motionDescriptor.forward = false;
                    break;
                case 'a':
                    this.motionDescriptor.left = false;
                    break;
                case 's':
                    this.motionDescriptor.reverse = false;
                    break;
                case 'd':
                    this.motionDescriptor.right = false;
                    break;
            }
        })        
    }    
}