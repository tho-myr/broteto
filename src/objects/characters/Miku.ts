import { Player } from '../Player';
import { Projectile } from '../Projectile';

export class Miku extends Player {
    // Override visual scaling or special updates if needed

    protected onDamageTaken(_amount: number) {
        this.fireCounterBeam();
    }

    private fireCounterBeam() {
        // Find nearest enemy
        // Since we don't have direct access to 'enemies' group here easily without passing it,
        // we might need to query the scene. But Player.update receives 'enemies'.
        // Wait, onDamageTaken is called from takeDamage, which is called from Game collision handler.
        // It's hard to get the enemies reference here directly unless we store it or query scene.
        
        // Let we use Scene query if possible, or assume access.
        // 'Game' scene has 'enemies' public? No, usually private.
        // But we can reach into the registry or use a global manager.
        // Or simpler: Just fire at a random angle if no target, or use the last known enemy position?
        // Actually, let's look at `this.scene`. If we cast it to `Game`, we might access enemies.
        
        // HACK: Cast scene to any to access enemies
        const gameScene = this.scene as any;
        if (!gameScene.enemies) return;

        let target: any = null;
        let minDist = 1000;
        
        gameScene.enemies.getChildren().forEach((child: any) => {
            if (!child.active) return;
            const d = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
            if (d < minDist) {
                minDist = d;
                target = child;
            }
        });

        if (target) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            
            // "White Line" Beam
            // We can use a Sprite with 'white_pixel' texture, scaled very wide.
            // Beam characteristics: extremely fast, high pierce.
            
            const dmg = (this.stats.rangedDamage || 0); 
            
            // We use Projectile class but with white_pixel. Duration 250ms for a "flash" beam feel.
            const proj = new Projectile(this.scene, this.x, this.y, 'white_pixel', dmg, 250, 10, 99);
            
            // Visuals: Make it a long line (entire map)
            // Scale X (Length) = 3000, Scale Y (Thickness) = 5
            proj.setScale(3000, 5); 
            proj.setTint(0xffffff); // White
            
            // Add to game projectiles group
            if (gameScene.projectiles) {
                gameScene.projectiles.add(proj);
            }

            // Fire and Auto-Destroy
            proj.fire(angle, 2000); // Very fast speed, handled by Projectile class
        }
    }

    public onCollect(pickup: any) {
        if (pickup.type === 'Material') {
             this.scene.sound.play('miku-mp3', { volume: 0.8 });
        }
    }
}
