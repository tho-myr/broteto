import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load loading bar asset or just text
    }

    create() {
        console.log('Boot complete, starting Preload');
        this.scene.start('Preload');
    }
}
