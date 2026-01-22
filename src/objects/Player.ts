import { Scene } from 'phaser';
import { StatType } from '../types';
import { WeaponInstance } from './WeaponInstance';
import { StatManager } from '../systems/StatManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
    stats: Record<StatType, number>;
    weapons: WeaponInstance[] = [];
    private readonly healthBar: Phaser.GameObjects.Graphics;
    private isInvulnerable: boolean = false;
    private invulnerabilityDuration: number = 150; 

    constructor(scene: Scene, x: number, y: number, texture: string = 'teto') {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(100); // Always on top

        // Adjust for image size if it's large (like the downloaded one might be)
        this.setDisplaySize(75, 75);
        
        // Capture the scale *after* resizing so we don't overwrite it with the tween
        const startScaleX = this.scaleX;
        const startScaleY = this.scaleY;

        // Dynamic Physics Body Sizing
        // Calculate radius based on original texture size to ensure correct scaling
        // We want the hitbox to be about 70% of the visible sprite width
        const radius = (this.width * 0.35); // 0.35 radius * 2 = 0.7 diameter
        const offsetX = (this.width - (radius * 2)) / 2;
        const offsetY = (this.height - (radius * 2)) / 2;
        
        this.setCircle(radius, offsetX, offsetY);

        this.setCollideWorldBounds(true);
        this.stats = StatManager.getBaseStats();
        
        // Default stats
        this.stats.maxHp = 20;
        this.currentHp = 20;

        // Subtle breathing animation
        this.scene.tweens.add({
            targets: this,
            scaleY: startScaleY * 1.1,
            scaleX: startScaleX * 0.9, // Slight squash to preserve volume feeling
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    currentHp: number = 20;

    update(time: number, delta: number, moveInput: Phaser.Math.Vector2, enemies: Phaser.Physics.Arcade.Group) {
        // Reset velocity
        this.setVelocity(0);

        const speedVal = 200 * (1 + this.stats.speed / 100);

        // moveInput is expected to be normalized or bounded to length 1
        if (moveInput.lengthSq() > 0) {
            this.setVelocity(moveInput.x * speedVal, moveInput.y * speedVal);
        }

        // Normalize checks explicitly just in case input wasn't perfect, 
        // though usually input vector is reliable. 
        // Actually, if we use setVelocity with components, physics handles it, 
        // but diagonal movement might need normalization if input was (1,1).
        // Let's assume inputVector IS the direction.
        
        if (this.body?.velocity) {
             // Ensure we don't exceed max speed if Input was > 1
             if (this.body.velocity.length() > speedVal) {
                this.body.velocity.normalize().scale(speedVal);
             }
        }

        // Update Weapons
        this.weapons.forEach(w => w.update(time, delta, enemies));
        
        // Update Health Bar
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.active) {
            this.healthBar.clear();
            return;
        }

        const x = this.x - 30;
        const y = this.y - 50;
        const width = 60;
        const height = 8;
        
        this.healthBar.clear();
        
        // Background (Black)
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(x - 1, y - 1, width + 2, height + 2);
        
        // Health (Always Red)
        const pct = Math.max(0, this.currentHp / this.stats.maxHp);
        
        this.healthBar.fillStyle(0xff0000); // Always red
        this.healthBar.fillRect(x, y, width * pct, height);
    }

    addWeapon(weaponDef: any, projectilesGroup?: Phaser.Physics.Arcade.Group) {
        const w = new WeaponInstance(this.scene, this, weaponDef, projectilesGroup);
        this.weapons.push(w);
        
        // Recalculate orbit positions if we want perfect spacing
        // For now, just pile them up or implement offset logic in WeaponInstance
    }

    takeDamage(amount: number): boolean {
        // Invulnerability Check
        if (this.isInvulnerable) return false;

        // Armor reduction: Damage * (100 / (100 + Armor)) approx formula
        
        // If armor is positive: damage reduction % = (armor / (armor + 15))
        let damage = amount;
        if (this.stats.armor > 0) {
             const reduction = this.stats.armor / (this.stats.armor + 15);
             damage = damage * (1 - reduction);
        } else {
             // Negative armor takes more damage?
             damage = damage * (2 - (15 / (15 - this.stats.armor))); // Approximation
        }

        // Dodge chance
        if (Math.random() * 100 < this.stats.dudge) {
            // Dodged!
            this.showFloatingText('Dodge!');
            return false;
        }

        this.currentHp -= damage;
        this.showFloatingText(`-${Math.floor(damage)}`, '#ff0000');
        
        this.onDamageTaken(damage);
        
        // Trigger Invulnerability
        this.isInvulnerable = true;
        this.setAlpha(0.6);
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            if (this.active) { // Safety check
                this.isInvulnerable = false;
                this.setAlpha(1);
            }
        });

        if (this.currentHp <= 0) {
            this.scene.events.emit('player-dead');
        }
        return true; // Damage Taken
    }

    // Virtual
    protected onDamageTaken(_amount: number) {}

    // Virtual
    public onCollect(pickup: any) {
        if (pickup.type === 'Material') {
             this.scene.sound.play('teto-mp3', { volume: 0.8 });
        }
    }

    heal(amount: number) {
        this.currentHp = Math.min(this.currentHp + amount, this.stats.maxHp);
        this.showFloatingText(`+${amount}`, '#00ff00');
    }

    showFloatingText(text: string, color: string = '#ffffff') {
        const t = this.scene.add.text(this.x, this.y - 20, text, { fontSize: '16px', color: color, stroke: '#000', strokeThickness: 2 });
        this.scene.tweens.add({
            targets: t,
            y: this.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => t.destroy()
        });
    }
}
