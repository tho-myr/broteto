import { Scene } from 'phaser';
import { Character, RunState, Weapon } from '../types';
import { STARTER_WEAPON, PISTOL_WEAPON } from '../data/items';
import { StatManager } from '../systems/StatManager';
import { Button, InputModeManager } from '../ui/Button';
import { GamepadManager } from '../systems/GamepadManager';

export class WeaponSelection extends Scene {

    private readonly weapons: Weapon[] = [STARTER_WEAPON, PISTOL_WEAPON];
    private selectedCharacter!: Character;
    private weaponButtons: Button[] = [];
    private gamepadManager!: GamepadManager;
    private selectedWeaponIdx: number = 0;
    private inputCooldown: number = 0;
    private cooldownDuration: number = 200;

    constructor() {
        super('WeaponSelection');
    }

    create(data: { character: Character }) {
        this.selectedCharacter = data.character;
        this.gamepadManager = new GamepadManager();
        this.inputCooldown = 0;
        this.selectedWeaponIdx = 0;

        const cx = this.cameras.main.centerX;

        this.add.text(cx, 100, 'SELECT STARTING WEAPON', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);

        // Display Weapons
        const startY = 300;

        this.weapons.forEach((w, idx) => {
             const y = startY + idx * 150;

             const btn = new Button(this, {
                 x: cx,
                 y: y,
                 width: 500,
                 height: 120,
                 text: `${w.name} - ${w.description}`,
                 fontSize: '20px',
                 onClick: () => this.startGame(w)
             });
             btn.setNormalColor(0x444444);
             this.weaponButtons.push(btn);
        });

        this.selectWeapon(0);
    }

    selectWeapon(idx: number) {
        this.selectedWeaponIdx = idx;
        this.weaponButtons.forEach((btn, i) => {
            if (i === idx) {
                btn.highlight();
            } else {
                btn.unhighlight();
            }
        });
    }

    update(delta: number) {
        // Detect gamepad input - switch to controller mode
        if (this.gamepadManager.isConnected()) {
            const dpad = this.gamepadManager.getDPadInput();
            const leftStick = this.gamepadManager.getLeftStickInput();
            if (dpad.y !== 0 || Math.abs(leftStick.y) > 0.5 || this.gamepadManager.isButtonDown('A')) {
                InputModeManager.setMode('controller');
            }
        }

        this.inputCooldown -= delta;
        if (this.inputCooldown > 0) return;

        // Handle D-pad/Left Stick for navigation
        const dpad = this.gamepadManager.getDPadInput();
        const leftStick = this.gamepadManager.getLeftStickInput();

        let moveY = dpad.y;
        if (Math.abs(leftStick.y) > 0.5) {
            moveY = leftStick.y > 0 ? 1 : -1;
        }

        if (moveY !== 0) {
            const newIdx = (this.selectedWeaponIdx + Math.sign(moveY) + this.weapons.length) % this.weapons.length;
            this.selectWeapon(newIdx);
            this.inputCooldown = this.cooldownDuration;
        }

        // Handle A button to confirm
        if (this.gamepadManager.isButtonDown('A')) {
            this.startGame(this.weapons[this.selectedWeaponIdx]);
            this.inputCooldown = this.cooldownDuration;
        }
    }

    startGame(startWeapon: Weapon) {
        // Build RunState
        const char = this.selectedCharacter;
        const baseStats = StatManager.getBaseStats();
        // Base stats
        baseStats.maxHp = 20;

        // Apply Character Stats
        for(const k in char.startingStats) {
            const key = k as keyof typeof baseStats;
            if(char.startingStats[key]) {
                baseStats[key] += char.startingStats[key];
            }
        }

        const runState: RunState = {
            characterId: char.id,
            wave: 1,
            currency: 0,
            currentHp: baseStats.maxHp,
            xp: 0,
            level: 1,
            stats: baseStats,
            items: [],
            weapons: [{ weaponId: startWeapon.id, instanceId: 'init' }],
            rerollPrice: 2
        };

        this.scene.start('Game', { runState });
    }
}
