import { Scene } from 'phaser';

export class Menu extends Scene {
    constructor() {
        super('Menu');
    }

    create() {
        console.log('Menu started');
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        console.log('Center:', cx, cy);

        this.add.text(cx, cy - 100, '🚬 BROTETO 🚬', {
            fontSize: '64px',
            color: '#d0021b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy, 'START RUN', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => {
             this.scene.start('CharacterSelection');
        });

        startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffff00' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ color: '#ffffff' }));

        // Continue Logic
        const saveRaw = localStorage.getItem('broteto_save_1');
        if (saveRaw) {
            try {
                const saveData = JSON.parse(saveRaw);
                if (saveData && saveData.activeRun) {
                    const continueBtn = this.add.text(cx, cy + 80, `CONTINUE (Wave ${saveData.activeRun.wave})`, {
                        fontSize: '32px',
                        color: '#ffffff',
                        backgroundColor: '#006400',
                        padding: { x: 20, y: 10 }
                    }).setOrigin(0.5).setInteractive();

                    continueBtn.on('pointerdown', () => {
                        if (saveData.activeRun.inShop) {
                             this.scene.start('Shop', { runState: saveData.activeRun });
                        } else {
                             this.scene.start('Game', { runState: saveData.activeRun, newRun: false });
                        }
                    });
                    
                    continueBtn.on('pointerover', () => continueBtn.setStyle({ color: '#ffff00' }));
                    continueBtn.on('pointerout', () => continueBtn.setStyle({ color: '#ffffff' }));
                }
            } catch (e) {
                console.error('Save file corrupt');
            }
        }
    }
}
