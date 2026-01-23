import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Miku } from '../objects/characters/Miku';
import { Osaka } from '../objects/characters/Osaka';
import { Teto } from '../objects/characters/Teto';
import { Projectile } from '../objects/Projectile';

export class CharacterFactory {
    /**
     * Creates a player instance of the correct character class
     */
    static createPlayer(characterId: string, scene: Scene, x: number, y: number, spriteKey: string): Player {
        switch (characterId) {
            case 'miku':
                return new Miku(scene, x, y, spriteKey);
            case 'osaka':
                return new Osaka(scene, x, y, spriteKey);
            case 'teto':
            default:
                return new Teto(scene, x, y, spriteKey);
        }
    }

    /**
     * Handles Miku's counter-attack beam on damage taken
     */
    static mikuOnDamageTaken(player: Player, _damage: number) {
        const gameScene = player.scene as any;
        if (!gameScene.enemies) return;

        let target: any = null;
        let minDist = 1000;

        gameScene.enemies.getChildren().forEach((child: any) => {
            if (!child.active) return;
            const d = Phaser.Math.Distance.Between(player.x, player.y, child.x, child.y);
            if (d < minDist) {
                minDist = d;
                target = child;
            }
        });

        if (target) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
            const dmg = (player.stats.rangedDamage || 0);

            const proj = new Projectile(player.scene, player.x, player.y, 'white_pixel', dmg, 250, 10, 99);
            proj.setScale(3000, 5);
            proj.setTint(0xffffff);

            if (gameScene.projectiles) {
                gameScene.projectiles.add(proj);
            }

            proj.fire(angle, 2000);
        }
    }

    /**
     * Handles Miku's material collection sound
     */
    static mikuOnCollect(player: Player, pickup: any) {
        if (pickup.type === 'Material') {
            player.scene.sound.play('miku-mat-audio', { volume: 0.8 });
        }
    }

    /**
     * Handles Osaka's material collection sound
     */
    static osakaOnCollect(player: Player, pickup: any) {
        if (pickup.type === 'Material') {
            if (player.scene.cache.audio.exists('osaka-mat-audio')) {
                player.scene.sound.play('osaka-mat-audio', { volume: 0.8 });
            } else {
                player.scene.sound.play('teto-mat-audio', { volume: 0.8 });
            }
        }
    }

    /**
     * Handles Teto's material collection sound (default)
     */
    static tetoOnCollect(player: Player, pickup: any) {
        if (pickup.type === 'Material') {
            player.scene.sound.play('teto-mat-audio', { volume: 0.8 });
        }
    }
}
