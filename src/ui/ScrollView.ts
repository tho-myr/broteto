import Phaser from 'phaser';

export default class ScrollView extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private contentContainer: Phaser.GameObjects.Container;
    private maskGraphics: Phaser.GameObjects.Graphics;
    private viewportHeight: number;
    private contentHeight: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        super(scene, x, y);
        this.viewportHeight = height;

        // Background (for input detection)
        this.bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0, 0)
            .setInteractive();
        this.add(this.bg);

        // Mask
        this.maskGraphics = scene.make.graphics({ x, y }, false);
        this.maskGraphics.fillStyle(0xffffff);
        this.maskGraphics.fillRect(0, 0, width, height);

        const mask = new Phaser.Display.Masks.GeometryMask(scene, this.maskGraphics);

        // Content
        this.contentContainer = scene.add.container(0, 0);
        this.contentContainer.setMask(mask);
        this.add(this.contentContainer);

        // Input
        this.bg.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number, _dz: number, event: any) => {
            this.scroll(dy);
            event.stopPropagation();
        });
        
        scene.add.existing(this);
    }

    public addContent(child: Phaser.GameObjects.GameObject) {
        this.contentContainer.add(child);
        this.updateContentHeight();
    }

    public removeAllContent() {
        this.contentContainer.removeAll(true);
        this.contentContainer.y = 0;
        this.contentHeight = 0;
    }

    public getContainer(): Phaser.GameObjects.Container {
        return this.contentContainer;
    }

    private updateContentHeight() {
        // Calculate bounds of children
        // Use a simple accumulation or getBounds (getBounds is expensive)
        // For simple vertical lists, we can trust the caller or just check the last child's Y + Height
        let maxY = 0;
        this.contentContainer.list.forEach((child: any) => {
            const y = child.y || 0;
            const h = child.height || 0;
            // displayHeight might be better if scaled
            const dh = (child.displayHeight !== undefined) ? child.displayHeight : h;
            if (y + dh > maxY) maxY = y + dh;
        });
        this.contentHeight = maxY;
    }
    
    // Allow manual setting if heuristic fails
    public setContentHeight(h: number) {
        this.contentHeight = h;
    }

    private scroll(deltaY: number) {
        const scrollSpeed = 0.5;
        const newY = this.contentContainer.y - (deltaY * scrollSpeed);
        
        // Bounds
        const minScroll = Math.min(0, -(this.contentHeight - this.viewportHeight + 20)); // +20 padding
        const maxScroll = 0;

        this.contentContainer.y = Phaser.Math.Clamp(newY, minScroll, maxScroll);
    }
}
