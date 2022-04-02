import * as THREE from 'three';

export class TreasureHuntManager {

    currentSpawnCycle: number;
    currentSpawnCoordinates: THREE.Vector3;

    currentSpawnModel: THREE.Object3D;

    constructor() {
        this.currentSpawnCycle = 0;
        this.currentSpawnCoordinates = new THREE.Vector3();
        this.currentSpawnModel = new THREE.Object3D();
    }

    spawnTreasure(scene: THREE.Scene, model: THREE.Object3D, position: THREE.Vector3) {
        const spawnCoordinates = new THREE.Vector3();
        spawnCoordinates.copy(position);

        scene.add(model);
        model.position.copy(spawnCoordinates);

        this.currentSpawnModel = model;
        this.currentSpawnCycle += 1;
        this.currentSpawnCoordinates.copy(spawnCoordinates);

        return spawnCoordinates;
    }

    findTreasure() {
        const foundingMessage = this.createTreasureFoundMessage((new Date()));
        return foundingMessage;   
    }

    createTreasureFoundMessage(time: Date) {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth * 5/7;
        canvas.height = window.innerHeight * 5/7;
        // Get the drawing context
        const context = canvas.getContext('2d')!;
        // Fill it with dark gray fro the background
        context.fillStyle = "hsla(0, 0%, 20%, 1.0)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Create the title
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0.0, "red");
        gradient.addColorStop(0.5, "purple");
        gradient.addColorStop(1.0, "red");
        context.fillStyle = gradient;
        context.font = "24px Montserrat";
        const textsize = context.measureText(`Treasure Hunt #${this.currentSpawnCycle}`);
        context.fillText(`Treasure Hunt #${this.currentSpawnCycle}`, textsize.width, 30);
        // Create and write message Body
        context.fillStyle = "white";
        context.font = "15px sans-serif";
        const text = `Congratulation!, you found the treasure at ${time.getMilliseconds()}th ms past the ${time.getSeconds()}th second of the ${time.getMinutes()}th minute of the ${time.getHours()}th hour. That is ${time.toUTCString()} in UTC. Send this to @aarohi_vnitnagpur on Instagram for a chance to win fabulous prizes.`
        const LINEMAX = canvas.width * 0.9;
        let lineNo = 15;
        let lineHeight = 15;
        let line = '';
        const begin = canvas.width * 0.05;
        for (let word of text.split(' ')) {
            const testLine = line + word + ' ';
            const testLineSize = context.measureText(testLine);
            const testWidth = testLineSize.width;
            if (testWidth > LINEMAX) {
                context.fillText(line, begin, lineNo * lineHeight)
                line = word + ' '
                lineNo += 1;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, 0, lineNo * lineHeight);
        return canvas;
    }
}