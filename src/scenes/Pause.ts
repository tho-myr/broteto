import { Scene } from 'phaser';

export class Pause extends Scene {
    constructor() {
        super('Pause');
    }

    create() {
        // Semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // "PAUSED" text
        this.add.text(this.scale.width / 2, this.scale.height / 3, 'PAUSED', {
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Resume Button
        const resumeBtn = this.add.text(this.scale.width / 2, this.scale.height / 2, 'RESUME', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.handleResume();
        })
        .on('pointerover', () => resumeBtn.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => resumeBtn.setStyle({ fill: '#ffffff' }));

        // Quit Button (Back to Menu)
        const quitBtn = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 'QUIT TO MENU', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#880000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.handleQuit();
        })
        .on('pointerover', () => quitBtn.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => quitBtn.setStyle({ fill: '#ffffff' }));

        // Also resume on ESC
        this.input.keyboard?.on('keydown-ESC', () => {
            this.handleResume();
        });
    }

    handleResume() {
        this.scene.resume('Game');
        this.scene.stop();
    }

    handleQuit() {
        this.scene.stop('Game'); // Stop the game scene completely
        this.scene.start('Menu'); // Go to Main Menu
        this.scene.stop(); // Stop self
    }
}
