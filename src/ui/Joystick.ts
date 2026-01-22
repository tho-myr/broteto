import Phaser from 'phaser';

export default class Joystick {

    readonly scene: Phaser.Scene;
    readonly base: Phaser.GameObjects.Graphics;
    readonly thumb: Phaser.GameObjects.Graphics;
    readonly vector: Phaser.Math.Vector2;
    readonly maxRadius: number;

    private pointer: Phaser.Input.Pointer | null = null;
    private isActive: boolean = false;

    constructor(scene: Phaser.Scene, maxRadius: number = 50) {
        this.scene = scene;
        this.maxRadius = maxRadius;
        this.vector = new Phaser.Math.Vector2(0, 0);

        // Created graphics, initially hidden
        this.base = this.scene.add.graphics().setScrollFactor(0).setDepth(1000).setVisible(false);
        this.base.lineStyle(4, 0xffffff, 0.3);
        this.base.strokeCircle(0, 0, this.maxRadius);

        this.thumb = this.scene.add.graphics().setScrollFactor(0).setDepth(1001).setVisible(false);
        this.thumb.fillStyle(0xffffff, 0.5);
        this.thumb.fillCircle(0, 0, this.maxRadius / 2);

        this.setupInput();
    }

    private setupInput(): void {
        this.scene.input.addPointer(2); // Ensure multi-touch support

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isActive = true;
            this.pointer = pointer;
            
            this.base.setVisible(true);
            this.base.setPosition(pointer.x, pointer.y);
            
            this.thumb.setVisible(true);
            this.thumb.setPosition(pointer.x, pointer.y);
            
            // Allow initial touch to be dead center
            this.vector.set(0, 0); 
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isActive && this.pointer === pointer) {
                const baseX = this.base.x;
                const baseY = this.base.y;
                
                let dx = pointer.x - baseX;
                let dy = pointer.y - baseY;
                
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Limit to max radius
                if (dist > this.maxRadius) {
                    const ratio = this.maxRadius / dist;
                    dx *= ratio;
                    dy *= ratio;
                }
                
                this.thumb.setPosition(baseX + dx, baseY + dy);
                
                // Normalize result (-1 to 1)
                this.vector.set(dx / this.maxRadius, dy / this.maxRadius);
            }
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.pointer === pointer) {
                this.isActive = false;
                this.pointer = null;
                this.base.setVisible(false);
                this.thumb.setVisible(false);
                this.vector.set(0, 0);
            }
        });
    }

    public getVector(): Phaser.Math.Vector2 {
        return this.vector;
    }

    public isRunning(): boolean {
        return this.isActive;
    }
}
