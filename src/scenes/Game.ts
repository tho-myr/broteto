import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Miku } from '../objects/characters/Miku';
import { Osaka } from '../objects/characters/Osaka';
import { Teto } from '../objects/characters/Teto';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { Pickup } from '../objects/Pickup';
import { STARTER_WEAPON, PISTOL_WEAPON } from '../data/items';
import { CHARACTERS } from '../data/characters';
import { EnemyStats, RunState } from '../types';
import { StatManager } from '../systems/StatManager';
import Joystick from '../ui/Joystick';

export class Game extends Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private projectiles!: Phaser.Physics.Arcade.Group;
    private pickups!: Phaser.Physics.Arcade.Group;
    private runState!: RunState;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    
    // Joystick
    private joystick!: Joystick;

    private spawnTimer: number = 0;
    private waveTimer: number = 0;
    private waveDuration: number = 30 * 1000; // 30s
    private isRunActive: boolean = true;

    // UI Refs
    private timerText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create(data: { newRun: boolean, runState?: RunState }) {
        if (data.runState) {
            this.runState = data.runState;
        } else {
             // Debug fallback
             this.runState = this.createNewRun();
        }

        this.isRunActive = true;
        this.waveTimer = 0;
        this.spawnTimer = 0; // Reset spawn timer
        
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.add.tileSprite(1000, 1000, 2000, 2000, 'grid_tile');

        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.projectiles = this.physics.add.group({ runChildUpdate: true });
        this.pickups = this.physics.add.group({ runChildUpdate: true });
        
        // Player Init
        const character = CHARACTERS.find(c => c.id === this.runState.characterId);
        const spriteKey = character ? character.spriteKey : 'teto';
        
        if (this.runState.characterId === 'miku') {
             this.player = new Miku(this, 1000, 1000, spriteKey);
        } else if (this.runState.characterId === 'osaka') {
             this.player = new Osaka(this, 1000, 1000, spriteKey);
        } else {
             this.player = new Teto(this, 1000, 1000, spriteKey);
        }

        this.player.setDepth(20);
        this.player.stats = { ...this.runState.stats };
        // ALWAYS START FULL HP
        this.player.currentHp = this.player.stats.maxHp;
        this.runState.currentHp = this.player.stats.maxHp; 

        // Load weapons from state
        this.runState.weapons.forEach(w => {
            const def = w.weaponId === 'stick' ? STARTER_WEAPON : (w.weaponId === 'pistol' ? PISTOL_WEAPON : STARTER_WEAPON);
            this.player.addWeapon(def, this.projectiles);
            // We don't need to push to runState.weapons again as it is already there
        });

        // Fallback for safety if somehow empty
        if (this.player.weapons.length === 0) {
             this.player.addWeapon(STARTER_WEAPON, this.projectiles);
             this.runState.weapons.push({ weaponId: 'stick', instanceId: 'fallback' });
        }

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 2000, 2000);

        // Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('W,A,S,D') as any;
        }

        // Collisions
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this);

        // Listen for events
        this.events.off('enemy-killed');
        this.events.off('player-dead');

        this.events.on('enemy-killed', (x: number, y: number, xpValue: number) => {
             const count = Phaser.Math.Between(0, 5);
             if (count > 0) {
                 // Distribute value roughly, ensuring at least 1 per item if dropped
                 const valPerItem = Math.max(1, Math.floor(xpValue / count));
                 
                 for (let i = 0; i < count; i++) {
                     // Random spread around death location
                     const spread = 30; // pixels
                     const dropX = x + Phaser.Math.Between(-spread, spread);
                     const dropY = y + Phaser.Math.Between(-spread, spread);

                     const p = new Pickup(this, dropX, dropY, valPerItem, 'Material', this.player);
                     this.pickups.add(p);
                 }
             }
        });
        
        // Listen for forced collection from Pickup object logic
        this.events.on('force-collect-pickup', (pickup: Pickup) => {
             this.collectPickup(pickup);
        });
        
        this.events.on('player-dead', () => {
             this.finishRun(false);
        });

        // UI
        this.createUI();

        // Pause Menu
        this.input.keyboard?.on('keydown-ESC', () => {
             this.scene.pause();
             this.scene.launch('Pause');
        });
    }

    createNewRun(): RunState {
        // Pick random character
        const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        console.log('Selected Character:', char.name);

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
        
        return {
            characterId: char.id,
            wave: 1,
            currency: 0,
            currentHp: baseStats.maxHp,
            xp: 0,
            level: 1,
            stats: baseStats,
            items: [],
            weapons: [],
            rerollPrice: 2
        };
    }

    createUI() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.waveText = this.add.text(w / 2, 20, `WAVE ${this.runState.wave}`, { fontSize: '24px', color: '#aaaaaa' })
            .setScrollFactor(0).setOrigin(0.5);

        this.timerText = this.add.text(w / 2, 50, '20', { fontSize: '40px', color: '#fff' })
            .setScrollFactor(0).setOrigin(0.5);
        
        // Bottom Left UI
        this.hpText = this.add.text(20, h - 80, 'HP: 20', { fontSize: '24px', color: '#0f0' })
            .setScrollFactor(0);
        this.goldText = this.add.text(20, h - 50, 'Gold: 0', { fontSize: '24px', color: '#ffD700' })
            .setScrollFactor(0);
        
        // Pause Button (Top Right)
        const pauseBtn = this.add.text(w - 30, 30, 'II', { fontSize: '30px', color: '#fff', fontStyle: 'bold' })
            .setScrollFactor(0).setOrigin(1, 0).setInteractive({ useHandCursor: true });
            
        pauseBtn.on('pointerdown', () => {
             this.scene.pause();
             this.scene.launch('Pause');
        });

        this.joystick = new Joystick(this);
    }

    updateUI() {
        if (!this.isRunActive) return;
        const remaining = Math.max(0, Math.ceil((this.waveDuration - this.waveTimer) / 1000));
        this.timerText.setText(remaining.toString());
        this.waveText.setText(`WAVE ${this.runState.wave}`);
        this.hpText.setText(`HP: ${Math.floor(this.player.currentHp)}/${this.player.stats.maxHp}`);
        this.goldText.setText(`Gold: ${this.runState.currency}`);
    }

    update(time: number, delta: number) {
        if (!this.isRunActive || !this.player.active) return;
        
        // Calculate Input Vector from Keyboard OR Joystick
        let moveInput = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            moveInput.x = -1;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            moveInput.x = 1;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            moveInput.y = -1;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            moveInput.y = 1;
        }
        
        // Normalize keyboard input
        if (moveInput.lengthSq() > 0) {
            moveInput.normalize();
        } else if (this.joystick.isRunning()) {
            // Use Joystick if no keyboard input
            moveInput.copy(this.joystick.getVector());
        }
        
        this.player.update(time, delta, moveInput, this.enemies);

        // Spawning logic
        this.spawnTimer += delta;
        // Scale spawn rate: Starts at 800ms, decreases by 30ms per wave, cap at 60ms
        const spawnInterval = Math.max(60, 800 - (this.runState.wave * 30)); 
        
        // Cap total enemies at 500
        if (this.spawnTimer > spawnInterval && this.enemies.countActive() < 500) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Wave Timer
        this.waveTimer += delta;
        if (this.waveTimer > this.waveDuration) {
            this.endWave();
        }
        
        this.updateUI();
    }

    spawnEnemy() {
         const angle = Math.random() * Math.PI * 2;
         const dist = 600;
         const cx = Phaser.Math.Clamp(this.player.x + Math.cos(angle)*dist, 50, 1950);
         const cy = Phaser.Math.Clamp(this.player.y + Math.sin(angle)*dist, 50, 1950);
         
         const stats: EnemyStats = {
            // Health scales linearly with wave count
            hp: 15 + (this.runState.wave * 8),
            damage: 2 + Math.floor(this.runState.wave / 2),
            // Speed scales really slowly (0.5 per wave starting from 50)
            speed: 50 + (this.runState.wave * 0.5),
            xpValue: 1 + Math.floor(this.runState.wave/5)
         };
         
         const enemy = new Enemy(this, cx, cy, 'enemy_basic', this.player, stats);
         this.enemies.add(enemy);
    }

    handlePlayerEnemyCollision(obj1: any, obj2: any) {
        const player = obj1 as Player;
        const enemy = obj2 as Enemy;
        
        if (enemy.active) {
            // Player takes damage and triggers hooks (e.g. miku beam)
            player.takeDamage(enemy.damage);
            
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            enemy.x -= Math.cos(angle) * 10;
            enemy.y -= Math.sin(angle) * 10;
        }
    }

    fireCounterBeam(player: Player, _targetData: {x: number, y: number}) {
        // Find nearest enemy if the one hitting us is gone? Or just fire at the angle of impact?
        // Let's fire at nearest enemy.
        let target: any = null;
        let minDist = 1000;
        
        this.enemies.getChildren().forEach(child => {
            const e = child as any;
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        });

        if (target) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
            
            // Constructor: scene, x, y, texture, damage, duration, knockback, pierce, group
            const dmg = (this.runState.stats.rangedDamage || 0); // 100% Ranged Damage
            const proj = new Projectile(this, player.x, player.y, 'bullet', dmg, 2000, 10, 99);
            
            // Hacky manual velocity set because Projectile constructor might expect just basic setup?
            // Actually Projectile doesn't set velocity in constructor shown above.
            // We need to set it.
            this.physics.velocityFromRotation(angle, 800, proj.body!.velocity);
            proj.setRotation(angle);

            // Visual for Beam? Make it faster/larger?
            proj.setScale(2, 0.5); 
            proj.setTint(0x39c5bb); // Miku Teal
            this.projectiles.add(proj);
        }
    }

    handleProjectileEnemyCollision(obj1: any, obj2: any) {
        const proj = obj1 as Projectile;
        const enemy = obj2 as Enemy;
        
        if (proj.active && enemy.active) {
            enemy.takeDamage(proj.damage);
            const angle = proj.rotation;
            enemy.x += Math.cos(angle) * proj.knockback;
            enemy.y += Math.sin(angle) * proj.knockback;

            proj.pierce--;
            if (proj.pierce < 0) {
                proj.destroy();
            }
        }
    }

    handlePickup(_obj1: any, obj2: any) {
        const pickup = obj2 as Pickup;
        if (pickup.active) {
            this.collectPickup(pickup);
        }
    }

    collectPickup(pickup: Pickup) {
        if (!pickup.active) return;
        this.runState.currency += pickup.value;
        this.runState.xp += pickup.value;
        
        // Delegate sound/effects to player instance
        this.player.onCollect(pickup);
        
        pickup.destroy();
    }

    endWave() {
        this.isRunActive = false;
        this.runState.currentHp = this.player.currentHp;
        this.runState.wave++;
        
        this.enemies.clear(true, true);
        this.projectiles.clear(true, true);
        this.pickups.clear(true, true);
        
        console.log('Wave Complete!');
        this.scene.start('Shop', { runState: this.runState });
    }

    finishRun(win: boolean) {
        this.isRunActive = false;
        console.log('Run Finished, Win:', win);
        this.scene.start('Menu');
    }
}
