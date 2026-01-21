import { Scene } from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    damage: number;
    duration: number;
    knockback: number;
    pierce: number;

    constructor(scene: Scene, x: number, y: number, texture: string, damage: number, duration: number, knockback: number, pierce: number = 0, group?: Phaser.Physics.Arcade.Group) {
        super(scene, x, y, texture);
        this.damage = damage;
        this.duration = duration;
        this.knockback = knockback;
        this.pierce = pierce;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        if (group) group.add(this);

        this.setDepth(15);
    }

    fire(angle: number, speed: number) {
        this.setRotation(angle);
        this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
        
        // Auto-destroy after duration
        this.scene.time.delayedCall(this.duration, () => {
             if (this.active) this.destroy();
        });
    }
}
