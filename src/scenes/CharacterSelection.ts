import { Scene } from 'phaser';
import { CHARACTERS } from '../data/characters';
import { StatManager } from '../systems/StatManager';
import { Character } from '../types';

export class CharacterSelection extends Scene {
    private selectedCharIndex: number = 0;
    
    constructor() {
        super('CharacterSelection');
    }

    create() {
        const cx = this.cameras.main.centerX;
        
        this.add.text(cx, 50, 'SELECT CHARACTER', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);

        // Character List (Bottom)
        const startX = cx - ((CHARACTERS.length * 100) / 2); // Center items
        
        CHARACTERS.forEach((_char, idx) => {
             const btnX = startX + idx * 100;
             const btnY = 600;
             
             // Container for button
             const container = this.add.container(btnX, btnY);
             
             // Background
             const bg = this.add.rectangle(0, 0, 80, 80, 0x333333).setInteractive();
             container.add(bg);
             
             // Image (Small)
             const img = this.add.image(0, 0, 'teto').setDisplaySize(60, 60); // Use teto for everything for now if unique assets missing
             container.add(img);
             
             bg.on('pointerdown', () => {
                 this.selectCharacter(idx);
             });
        });

        // Initial Selection
        this.selectCharacter(0);

        // Confirm Button
        const confirmBtn = this.add.text(cx, 680, 'CONFIRM', { 
            fontSize: '32px', backgroundColor: '#006400', padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive();

        confirmBtn.on('pointerdown', () => {
             this.startWeaponSelection();
        });
    }

    selectCharacter(index: number) {
        this.selectedCharIndex = index;
        const char = CHARACTERS[index];
        
        // Refresh display
        // ... (We would usually have a "SelectionHighlight" graphics object to move around)
        
        this.showCharacterDetails(char);
    }

    showCharacterDetails(char: Character) {
        // Clear previous View
        // (Simplified: just redraw text over or use a container used for view)
        // Ideally we keep references and update text. 
        
        // Remove old details if any (simple hack: clear scene part or use specific container)
        // Let's use a unique name for the container to find and destroy it
        const existing = this.children.getByName('detailsContainer') as Phaser.GameObjects.Container;
        if (existing) existing.destroy();

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        
        const container = this.add.container(cx, cy - 50);
        container.setName('detailsContainer');

        // Big Image
        const bigImg = this.add.image(-200, 0, 'teto').setDisplaySize(200, 200);
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
        
        // Show modifiers
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
}
