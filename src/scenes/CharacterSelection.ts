import {Scene} from 'phaser';
import {CHARACTERS} from '../data/characters';
import {StatManager} from '../systems/StatManager';
import {Character} from '../types';
import { Button, InputModeManager } from '../ui/Button';
import { GamepadManager } from '../systems/GamepadManager';

export class CharacterSelection extends Scene {
    private selectedCharIndex: number = 0;
    private characterButtons: Phaser.GameObjects.Rectangle[] = [];
    private gamepadManager!: GamepadManager;
    private inputCooldown: number = 0;
    private cooldownDuration: number = 200;

    constructor() {
        super('CharacterSelection');
    }

    create() {
        this.gamepadManager = new GamepadManager();
        this.inputCooldown = 0;

        const cx = this.cameras.main.centerX;
        
        this.add.text(cx, 50, 'SELECT CHARACTER', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);

        // Character List (Bottom - Centered)
        const itemSize = 100;
        const totalWidth = CHARACTERS.length * itemSize;
        const startX = cx - (totalWidth / 2) + (itemSize / 2); 
        const listY = this.scale.height - 150;

        CHARACTERS.forEach((_char, idx) => {
             const btnX = startX + idx * itemSize;
             const container = this.add.container(btnX, listY);
             
             // Background
             const bg = this.add.rectangle(0, 0, 80, 80, 0x333333);
             bg.setStrokeStyle(2, 0xffffff);
             bg.setInteractive({ useHandCursor: true });
             container.add(bg);
             this.characterButtons.push(bg);

             // Image (Small)
             const img = this.add.image(0, 0, _char.spriteKey).setDisplaySize(60, 60);
             container.add(img);
             
             bg.on('pointerdown', () => {
                 this.selectCharacter(idx);
             });
        });

        // Initial Selection
        this.selectCharacter(0);

        // Confirm Button
        const confirmBtn = new Button(this, {
            x: cx,
            y: this.scale.height - 50,
            text: 'CONFIRM',
            onClick: () => this.startWeaponSelection()
        });
        confirmBtn.setNormalColor(0x006400);
    }

    selectCharacter(index: number) {
        this.selectedCharIndex = index;

        // Update character button highlights
        this.characterButtons.forEach((btn, idx) => {
            if (idx === index) {
                btn.setStrokeStyle(4, 0xffff00);
                btn.setFillStyle(0x444444);
            } else {
                btn.setStrokeStyle(2, 0xffffff);
                btn.setFillStyle(0x333333);
            }
        });

        const char = CHARACTERS[index];
        this.showCharacterDetails(char);
    }

    showCharacterDetails(char: Character) {
        const existing = this.children.getByName('detailsContainer') as Phaser.GameObjects.Container;
        if (existing) existing.destroy();

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        
        const container = this.add.container(cx, cy - 50);
        container.setName('detailsContainer');

        // Big Image
        const bigImg = this.add.image(-200, 0, char.spriteKey || 'teto').setDisplaySize(200, 200);
        container.add(bigImg);
        
        // Name
        const nameText = this.add.text(0, -100, char.name, { fontSize: '36px', color: '#d0021b', fontStyle: 'bold' });
        container.add(nameText);
        
        // Desc
        const descText = this.add.text(0, -50, char.description, { fontSize: '20px', color: '#aaaaaa', wordWrap: { width: 400 } });
        container.add(descText);

        // Stats
        let statsY = 20;
        const base = StatManager.getBaseStats();
        
        for (const k in char.startingStats) {
             const key = k;
             const val = char.startingStats[key as keyof typeof base];
             if (val) {
                 const color = val > 0 ? '#0f0' : '#f00';
                 const txt = this.add.text(0, statsY, `${key}: ${val > 0 ? '+' : ''}${val}`, { fontSize: '20px', color: color });
                 container.add(txt);
                 statsY += 30;
             }
        }
    }

    startWeaponSelection() {
        const char = CHARACTERS[this.selectedCharIndex];
        this.scene.start('WeaponSelection', { character: char });
    }

    update(delta: number) {
        this.inputCooldown -= delta;
        if (this.inputCooldown > 0) return;

        // Detect any gamepad input and switch to controller mode
        if (this.gamepadManager.isConnected()) {
            InputModeManager.setMode('controller');
        }

        // Handle D-pad/Left Stick for navigation
        const dpad = this.gamepadManager.getDPadInput();
        const leftStick = this.gamepadManager.getLeftStickInput();

        let moveX = dpad.x;
        if (Math.abs(leftStick.x) > 0.5) {
            moveX = leftStick.x > 0 ? 1 : -1;
        }

        if (moveX !== 0) {
            this.selectedCharIndex = (this.selectedCharIndex + Math.sign(moveX) + CHARACTERS.length) % CHARACTERS.length;
            this.selectCharacter(this.selectedCharIndex);
            this.inputCooldown = this.cooldownDuration;
        }

        // Handle A button to confirm
        if (this.gamepadManager.isButtonDown('A')) {
            this.startWeaponSelection();
            this.inputCooldown = this.cooldownDuration;
        }
    }
}
