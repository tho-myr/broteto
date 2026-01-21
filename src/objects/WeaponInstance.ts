import { Scene } from 'phaser';
import { Weapon as WeaponType, WeaponStats } from '../types';
import { Player } from './Player'; // Forward ref, careful
import { StatManager } from '../systems/StatManager';
import { Projectile } from './Projectile';

export class WeaponInstance {
    scene: Scene;
    definition: WeaponType;
    stats: WeaponStats;
    sprite: Phaser.GameObjects.Sprite;
    lastFired: number = 0;
    owner: Player;
    projectilesGroup?: Phaser.Physics.Arcade.Group;
    
    private currentTarget: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
    
    constructor(scene: Scene, owner: Player, definition: WeaponType, projectilesGroup?: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.owner = owner;
        this.definition = definition;
        this.stats = definition.weaponStats;
        this.projectilesGroup = projectilesGroup;

        // Spread out firing times
        this.lastFired = -Math.random() * (this.stats.cooldown || 500);

        // Create visual
        this.sprite = scene.add.sprite(owner.x, owner.y, definition.icon || 'weapon_stick');
        this.sprite.setOrigin(0, 0.5); // Pivot at handle
    }

    update(time: number, _delta: number, enemies: Phaser.Physics.Arcade.Group) {
        // Orbit logic? or just follow 
        // For simplicity, let's just make them stick to player for now, maybe offset
        
        // Find Target Logic
        const currentRange = StatManager.getWeaponRange(this.stats, this.owner.stats);
        
        // Check current target validity
        if (this.currentTarget) {
            if (!this.currentTarget.active || 
                Phaser.Math.Distance.Between(this.owner.x, this.owner.y, this.currentTarget.x, this.currentTarget.y) > currentRange) {
                this.currentTarget = null;
            }
        }

        // Scan if no target
        if (!this.currentTarget) {
             const potentialTargets: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
             enemies.getChildren().forEach(child => {
                 const enemy = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                 if (!enemy.active) return;
                 if (Phaser.Math.Distance.Between(this.owner.x, this.owner.y, enemy.x, enemy.y) <= currentRange) {
                     potentialTargets.push(enemy);
                 }
             });

             if (potentialTargets.length > 0) {
                 // Priority: "Strong" (> 50 HP)
                 // Then: Random
                 const strong = potentialTargets.filter(e => {
                     // Duck typing check for HP
                     return (e as any).currentHp && (e as any).currentHp >= 50;
                 });

                 if (strong.length > 0) {
                     this.currentTarget = Phaser.Utils.Array.GetRandom(strong);
                 } else {
                     // Pick random to avoid focus fire on same weak enemy
                     this.currentTarget = Phaser.Utils.Array.GetRandom(potentialTargets);
                 }
             }
        }
        
        const target = this.currentTarget;

        // Rotation
        if (target) {
            const angle = Phaser.Math.Angle.Between(this.owner.x, this.owner.y, target.x, target.y);
            this.sprite.setRotation(angle);
            
            // Fire
            const cooldown = StatManager.getWeaponCooldown(this.stats, this.owner.stats);
            if (time > this.lastFired + cooldown) {
                this.fire(target, angle);
                this.lastFired = time;
            }
        } else {
             // Idle rotation?
             this.sprite.setRotation(this.owner.rotation);
        }

        // Stick to owner (maybe add orbital offset later based on index)
        this.sprite.setPosition(this.owner.x, this.owner.y);
    }

    fire(target: Phaser.Physics.Arcade.Sprite, angle: number) {
        const damage = StatManager.getWeaponDamage(this.stats, this.owner.stats);
        
        // Visual
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.owner.x + Math.cos(angle) * 10,
            y: this.owner.y + Math.sin(angle) * 10,
            duration: 50,
            yoyo: true
        });

        if (this.definition.type === 'Melee') {
            // Create a temporary hitbox logic or just strict distance check?
            // For Phaser, best to create an invisible projectile that dies instantly?
            // Or just check overlap now.
            
            // Simple melee: AOE arc? or just single target hit?
            // Brotato melee is an AOE sweep usually.
            // Let's spawn a short lived "MeleeSlash" projectile
            
            // TODO: Melee logic
            // Hack for now: Damage target directly if in range + small cooldown
             // target.takeDamage(damage) -> We don't have takeDamage on generic Sprite yet.
             // We will emit an event or call a method if we cast it.
             (target as any).takeDamage?.(damage);

        } else {
            // Ranged
            this.scene.sound.play('gunshot', { volume: 0.5 });

            const projSpeed = this.stats.projectileSpeed || 500;
            const proj = new Projectile(
                this.scene, 
                this.owner.x, 
                this.owner.y, 
                this.definition.projectileKey || 'bullet',
                damage,
                this.stats.duration || 2000,
                this.stats.knockback,
                this.stats.penetration || 0,
                this.projectilesGroup
            );
            proj.fire(angle, projSpeed);
        }
    }
}
