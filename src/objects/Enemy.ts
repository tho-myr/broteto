import { Scene } from 'phaser';
import { EnemyStats } from '../types';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    hp: number;
    damage: number;
    speed: number;
    target: Phaser.Physics.Arcade.Sprite;
    params: EnemyStats;

    constructor(scene: Scene, x: number, y: number, texture: string, target: Phaser.Physics.Arcade.Sprite, stats: EnemyStats) {
        super(scene, x, y, texture);
        this.target = target;
        this.params = stats;
        
        this.hp = stats.hp;
        this.damage = stats.damage;
        this.speed = stats.speed;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCircle(14); // radius matching texture
        this.setCollideWorldBounds(false); // Can spawn outside
        this.setDepth(10);
    }

    update(_time: number, _delta: number) {
        if (!this.active) return;
        
        if (this.target && this.target.active) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
        } else {
            this.setVelocity(0);
        }
    }

    takeDamage(amount: number) {
        this.hp -= amount;
        
        this.showDamageText(amount);

        // Flash white
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        // Knockback (simple stop)
        // this.setVelocity(0); // Optional: reset velocity slightly

        if (this.hp <= 0) {
            this.die();
        }
    }

    showDamageText(amount: number) {
        // Randomize X slightly to prevent perfect stacking
        const rx = this.x + Phaser.Math.Between(-10, 10);
        const t = this.scene.add.text(rx, this.y - 20, Math.floor(amount).toString(), { 
            fontSize: '14px', 
            color: '#fff', 
            stroke: '#000', 
            strokeThickness: 2,
            fontFamily: 'Arial'
        });
        t.setDepth(30); // Higher than player(20) and enemy(10)
        
        this.scene.tweens.add({
            targets: t,
            y: t.y - 30,
            alpha: 0,
            duration: 600,
            ease: 'Power1',
            onComplete: () => t.destroy()
        });
    }

    die() {
        // Emit event with coordinates and XP value
        this.scene.events.emit('enemy-killed', this.x, this.y, this.params.xpValue);
        this.destroy();
    }
}
