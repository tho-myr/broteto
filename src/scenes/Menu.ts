import { Scene } from 'phaser';
import { GamepadManager } from '../systems/GamepadManager';
import { Button, InputModeManager } from '../ui/Button';

export class Menu extends Scene {
    private gamepadManager!: GamepadManager;
    private selectedButtonIndex: number = 0;
    private buttons: Button[] = [];
    private inputCooldown: number = 0;
    private cooldownDuration: number = 200; // ms

    constructor() {
        super('Menu');
    }

    create() {
        console.log('Menu started');

        // Play background music on loop
        if (!this.sound.isPlaying('bgm_bruh')) {
            this.sound.play('bgm_bruh', { loop: true, volume: 0.75 });
        }

        // Initialize Gamepad Manager
        this.gamepadManager = new GamepadManager(0.15);
        this.inputCooldown = 0;

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        console.log('Center:', cx, cy);

        this.add.text(cx, cy - 100, '🚬 BROTETO 🚬', {
            fontSize: '64px',
            color: '#d0021b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // START RUN Button
        const startBtn = new Button(this, {
            x: cx,
            y: cy,
            text: 'START RUN',
            onClick: () => {
                this.scene.start('CharacterSelection');
            }
        });
        startBtn.setNormalColor(0x333333);
        this.buttons.push(startBtn);

        // Continue Logic
        const saveRaw = localStorage.getItem('broteto_save_1');
        if (saveRaw) {
            try {
                const saveData = JSON.parse(saveRaw);
                if (saveData && saveData.activeRun) {
                    const continueBtn = new Button(this, {
                        x: cx,
                        y: cy + 80,
                        width: 350,
                        height: 60,
                        fontSize: '28px',
                        text: `CONTINUE (Wave ${saveData.activeRun.wave})`,
                        onClick: () => {
                            if (saveData.activeRun.inShop) {
                                 this.scene.start('Shop', { runState: saveData.activeRun });
                            } else {
                                 this.scene.start('Game', { runState: saveData.activeRun, newRun: false });
                            }
                        }
                    });
                    continueBtn.setNormalColor(0x006400);
                    this.buttons.push(continueBtn);
                }
            } catch (e) {
                console.error('Save file corrupt');
            }
        }

        // Update selection highlight
        this.updateButtonSelection();
    }

    private updateButtonSelection(): void {
        this.buttons.forEach((btn, idx) => {
            if (idx === this.selectedButtonIndex) {
                btn.highlight();
            } else {
                btn.unhighlight();
            }
        });
    }

    update(delta: number): void {
        if (!this.gamepadManager.isConnected() || this.buttons.length === 0) return;

        // Detect gamepad input - switch to controller mode
        const dpad = this.gamepadManager.getDPadInput();
        const leftStick = this.gamepadManager.getLeftStickInput();

        if (dpad.y !== 0 || Math.abs(leftStick.y) > 0.5 || this.gamepadManager.isButtonDown('A')) {
            InputModeManager.setMode('controller');
        }

        // Handle input cooldown
        this.inputCooldown -= delta;
        if (this.inputCooldown > 0) return;

        // Handle D-pad or left stick for navigation

        if (dpad.y < 0 || leftStick.y < -0.5) {
            this.selectedButtonIndex = Math.max(0, this.selectedButtonIndex - 1);
            this.updateButtonSelection();
            this.inputCooldown = this.cooldownDuration;
        } else if (dpad.y > 0 || leftStick.y > 0.5) {
            this.selectedButtonIndex = Math.min(this.buttons.length - 1, this.selectedButtonIndex + 1);
            this.updateButtonSelection();
            this.inputCooldown = this.cooldownDuration;
        }

        // Handle A button to select
        if (this.gamepadManager.isButtonDown('A')) {
            this.buttons[this.selectedButtonIndex].emit('pointerdown');
            this.inputCooldown = this.cooldownDuration;
        }
    }
}
