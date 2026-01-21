import { Player } from '../Player';

export class Osaka extends Player {
    public onCollect(pickup: any) {
        if (pickup.type === 'Material') {
             // Check if osaka sound exists
             if (this.scene.cache.audio.exists('osaka-mp3')) {
                  this.scene.sound.play('osaka-mp3', { volume: 0.8 });
             } else {
                  this.scene.sound.play('teto-mp3', { volume: 0.8 });
             }
        }
    }
}
