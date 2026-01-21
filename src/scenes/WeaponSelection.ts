import { Scene } from 'phaser';
import { Character, RunState, Weapon } from '../types';
import { STARTER_WEAPON, PISTOL_WEAPON } from '../data/items';
import { StatManager } from '../systems/StatManager';

export class WeaponSelection extends Scene {
    private selectedCharacter!: Character;
    private weapons: Weapon[] = [STARTER_WEAPON, PISTOL_WEAPON];

    constructor() {
        super('WeaponSelection');
    }

    create(data: { character: Character }) {
        this.selectedCharacter = data.character;
        const cx = this.cameras.main.centerX;

        this.add.text(cx, 100, 'SELECT STARTING WEAPON', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);

        // Display Weapons
        const startY = 300;
        
        this.weapons.forEach((w, idx) => {
             const y = startY + idx * 150;
             
             const container = this.add.container(cx, y);
             // Size
             const bg = this.add.rectangle(0, 0, 500, 120, 0x444444).setInteractive();
             container.add(bg);
             
             // Icon (Placeholder rect or text)
             const icon = this.add.rectangle(-200, 0, 80, 80, 0x888888);
             container.add(icon);
             const iconText = this.add.text(-200, 0, w.name.substring(0,2), { fontSize: '30px' }).setOrigin(0.5);
             container.add(iconText);
             
             // Name
             const name = this.add.text(-120, -30, w.name, { fontSize: '24px', fontStyle: 'bold' });
             container.add(name);
             
             // Desc
             const desc = this.add.text(-120, 10, w.description, { fontSize: '18px', color: '#ccc' });
             container.add(desc);
             
             bg.on('pointerdown', () => {
                 this.startGame(w);
             });
             
             bg.on('pointerover', () => bg.setFillStyle(0x666666));
             bg.on('pointerout', () => bg.setFillStyle(0x444444));
        });
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
                baseStats[key] += char.startingStats[key]!;
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
