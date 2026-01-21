import { Scene } from 'phaser';
import { Player } from './Player';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
    value: number;
    type: 'Material' | 'Health';
    targetPlayer?: Player;
    isCollected: boolean = false;

    constructor(scene: Scene, x: number, y: number, value: number, type: 'Material' | 'Health' = 'Material', target?: Player) {
        super(scene, x, y, type === 'Material' ? 'material' : 'material'); // Use 'material' texture for now
        this.value = value;
        this.type = type;
        this.targetPlayer = target;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Pickups are small
        this.setScale(0.8);
        this.setCircle(5);
        this.setDepth(5);
        
        // Magnet effect to be handled in Update if close to player
    }

    update(_time: number, _delta: number) {
        if (!this.targetPlayer || !this.targetPlayer.active || this.isCollected) return;

        // Check distance
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
        
        const pickupRange = this.targetPlayer.stats.pickupRange || 100;
        
        if (dist <= pickupRange) {
             // Fly towards player
             // Speed increases as it gets closer or over time?
             // Simple moveToObject
             this.scene.physics.moveToObject(this, this.targetPlayer, 500 + (15000/dist)); // Faster when closer
             
             // Check if VERY close to manually collect (fix "orbiting" issue)
             if (dist < 30) { 
                 // Force collection via event
                 this.scene.events.emit('force-collect-pickup', this);
                 this.isCollected = true;
                 this.destroy(); // Destroy immediately to prevent physics glitches
             }
        } else {
            this.setVelocity(0);
        }
    }
}
