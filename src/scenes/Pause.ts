import { Scene } from 'phaser';
import { GamepadManager } from '../systems/GamepadManager';
import { Button, InputModeManager } from '../ui/Button';

export class Pause extends Scene {
    private gamepadManager!: GamepadManager;
    private selectedButton: number = 0;
    private buttons: Button[] = [];
    private inputCooldown: number = 0;
    private cooldownDuration: number = 200;

    constructor() {
        super('Pause');
    }

    create() {
        this.gamepadManager = new GamepadManager();
        this.selectedButton = 0;
        this.buttons = [];
        this.inputCooldown = 0;

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

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Resume Button
        const resumeBtn = new Button(this, {
            x: cx,
            y: cy,
            text: 'RESUME',
            onClick: () => this.handleResume()
        });
        resumeBtn.setNormalColor(0x333333);
        this.buttons.push(resumeBtn);

        // Quit Button
        const quitBtn = new Button(this, {
            x: cx,
            y: cy + 80,
            text: 'QUIT TO MENU',
            onClick: () => this.handleQuit()
        });
        quitBtn.setNormalColor(0x880000);
        this.buttons.push(quitBtn);

        // Keyboard input
        this.input.keyboard?.on('keydown-ESC', () => {
            this.handleResume();
        });

        this.updateButtonHighlight();
    }

    update(delta: number) {
        // Detect gamepad input - switch to controller mode
        if (this.gamepadManager.isConnected()) {
            const dpad = this.gamepadManager.getDPadInput();
            if (dpad.y !== 0 || this.gamepadManager.isButtonDown('A') || this.gamepadManager.isButtonDown('START')) {
                InputModeManager.setMode('controller');
            }
        }

        this.inputCooldown -= delta;
        if (this.inputCooldown > 0) return;

        // Handle D-pad for navigation
        const dpad = this.gamepadManager.getDPadInput();
        if (dpad.y > 0) {
            // Down
            this.selectedButton = (this.selectedButton + 1) % this.buttons.length;
            this.updateButtonHighlight();
            this.inputCooldown = this.cooldownDuration;
        } else if (dpad.y < 0) {
            // Up
            this.selectedButton = (this.selectedButton - 1 + this.buttons.length) % this.buttons.length;
            this.updateButtonHighlight();
            this.inputCooldown = this.cooldownDuration;
        }

        // Handle button presses
        if (this.gamepadManager.isButtonDown('A')) {
            if (this.selectedButton === 0) {
                this.handleResume();
            } else {
                this.handleQuit();
            }
            this.inputCooldown = this.cooldownDuration;
        }

        // START button to resume
        if (this.gamepadManager.isButtonDown('START')) {
            this.handleResume();
            this.inputCooldown = this.cooldownDuration;
        }
    }

    updateButtonHighlight() {
        this.buttons.forEach((btn, idx) => {
            if (idx === this.selectedButton) {
                btn.highlight();
            } else {
                btn.unhighlight();
            }
        });
    }

    handleResume() {
        this.scene.resume('Game');
        this.scene.stop();
    }

    handleQuit() {
        this.scene.stop('Game');
        this.scene.start('Menu');
        this.scene.stop();
    }
}
