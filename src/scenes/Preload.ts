import { Scene } from 'phaser';
import {CHARACTERS} from "../data/characters.ts";

export class Preload extends Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        console.log('Preload started');
        CHARACTERS.forEach((char) => {
            this.load.image(char.spriteKey, char.spriteLocation);
            this.load.audio(char.materialCollectionSoundKey, char.materialCollectionSoundLocation);
        })

        // Load background music
        this.load.audio('bgm_bruh', 'assets/music/bruh.mp3');
        this.load.audio('gunshot', 'assets/sounds/gunshot.mp3');

        // Create a basic loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        console.log('Preload complete, checking assets');

        // 1. Teto Fallback (if image failed to load)
        if (!this.textures.exists('teto')) {
            const gfx = this.make.graphics({ x: 0, y: 0 });
            gfx.fillStyle(0xd0021b);
            gfx.fillCircle(16, 16, 16);
            gfx.generateTexture('teto', 32, 32);
            gfx.destroy();
        }
        
        // Osaka Fallback
        if (!this.textures.exists('osaka')) {
            const gfx = this.make.graphics({ x: 0, y: 0 });
            gfx.fillStyle(0xffff00); // Yellow
            gfx.fillCircle(16, 16, 16);
            gfx.generateTexture('osaka', 32, 32);
            gfx.destroy();
        }

        // Miku Fallback
        if (!this.textures.exists('miku')) {
            const gfx = this.make.graphics({ x: 0, y: 0 });
            gfx.fillStyle(0x39c5bb); // Teal
            gfx.fillCircle(16, 16, 16);
            gfx.generateTexture('miku', 32, 32);
            gfx.destroy();
        }

        // White Line / Pixel (for Beam)
        if (!this.textures.exists('white_pixel')) {
            const gfx = this.make.graphics({ x:0, y:0 });
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRect(0,0,1,1);
            gfx.generateTexture('white_pixel', 1, 1);
            gfx.destroy();
        }

        // --- Generate Placeholder Assets for others ---
        const gfx = this.make.graphics({ x: 0, y: 0 });

        // 2. Enemy (Basic) - Green Blob
        gfx.fillStyle(0x7ed321);
        gfx.fillCircle(16, 16, 14);
        gfx.generateTexture('enemy_basic', 32, 32);
        gfx.clear();

        // 3. Bullet/Projectile
        gfx.fillStyle(0xf8e71c);
        gfx.fillCircle(5, 5, 5);
        gfx.generateTexture('bullet', 10, 10);
        gfx.clear();

        // 4. Material/XP
        gfx.fillStyle(0x7ed321); // Green XP
        gfx.fillRect(0,0, 10, 10);
        gfx.generateTexture('material', 10, 10);
        gfx.clear();

        // 5. Coin (Currency)
        gfx.fillStyle(0xf5a623); 
        gfx.fillCircle(6, 6, 6);
        gfx.generateTexture('coin', 12, 12);
        gfx.clear();

        // 6. Chest
        gfx.fillStyle(0x8b572a);
        gfx.fillRect(0, 0, 24, 20);
        gfx.generateTexture('chest', 24, 20);
        gfx.clear();
        
        // 7. Weapon (Simple Sword/Stick)
        gfx.fillStyle(0xaaaaaa);
        gfx.fillRect(0, 12, 32, 8); // Horizontal stick
        gfx.generateTexture('weapon_stick', 32, 32);
        gfx.clear();

         // 8. Ground/Grass tile (optional background)
         gfx.fillStyle(0x333333);
         gfx.fillRect(0, 0, 64, 64);
         gfx.lineStyle(2, 0x444444);
         gfx.strokeRect(0, 0, 64, 64);
         gfx.generateTexture('grid_tile', 64, 64);
         gfx.destroy();

         this.scene.start('Menu');
    }
}
