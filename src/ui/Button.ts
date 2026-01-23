import { Scene } from 'phaser';

export interface ButtonConfig {
    x: number;
    y: number;
    text: string;
    width?: number;
    height?: number;
    fontSize?: string;
    onClick: () => void;
    enabled?: boolean;
}

// Global input mode tracking
export class InputModeManager {
    private static currentMode: 'controller' | 'mouse' = 'mouse';

    static setMode(mode: 'controller' | 'mouse') {
        this.currentMode = mode;
    }

    static getMode(): 'controller' | 'mouse' {
        return this.currentMode;
    }

    static isControllerMode(): boolean {
        return this.currentMode === 'controller';
    }
}

export class Button extends Phaser.GameObjects.Container {
    private bg!: Phaser.GameObjects.Rectangle;
    private text!: Phaser.GameObjects.Text;
    private enabled: boolean = true;
    private hovered: boolean = false;
    private onClick: () => void;

    private normalColor: number = 0x333333;
    private hoverColor: number = 0x444444;
    private disabledColor: number = 0x222222;
    private textNormalColor: string = '#ffffff';
    private textHoverColor: string = '#ffff00';
    private textDisabledColor: string = '#666666';

    constructor(scene: Scene, config: ButtonConfig) {
        const width = config.width || 200;
        const height = config.height || 50;

        super(scene, config.x, config.y);
        scene.add.existing(this);
        this.setDepth(100);

        this.onClick = config.onClick;
        this.enabled = config.enabled !== false;

        // Background Rectangle
        this.bg = scene.add.rectangle(0, 0, width, height, this.normalColor);
        this.bg.setStrokeStyle(2, 0xffffff);
        this.bg.setOrigin(0.5);
        this.add(this.bg);

        // Text
        this.text = scene.add.text(0, 0, config.text, {
            fontSize: config.fontSize || '24px',
            color: this.textNormalColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.text);

        // Interactive - Container needs size set before setInteractive
        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', () => this.handleClick());
        this.on('pointerover', () => this.handleHover());
        this.on('pointerout', () => this.handleOut());
    }

    private handleClick() {
        if (!this.enabled) return;
        // Safely check if scene and sound system exist
        if (this.scene?.sound) {
            this.scene.sound.play('press');
        }
        this.onClick();
    }

    private handleHover() {
        if (!this.enabled) return;
        // Only show hover effect if NOT in controller mode
        if (InputModeManager.getMode() === 'mouse') {
            this.hovered = true;
            this.updateStyle();
        }
    }

    private handleOut() {
        this.hovered = false;
        this.updateStyle();
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.updateStyle();
    }

    public setNormalColor(color: number) {
        this.normalColor = color;
        this.updateStyle();
    }

    public setHoverColor(color: number) {
        this.hoverColor = color;
    }

    public setDisabledColor(color: number) {
        this.disabledColor = color;
        this.updateStyle();
    }

    public setText(text: string) {
        this.text.setText(text);
    }

    public highlight() {
        // Only highlight if in controller mode
        if (InputModeManager.isControllerMode()) {
            this.hovered = true;
            this.updateStyle();
        }
    }

    public unhighlight() {
        this.hovered = false;
        this.updateStyle();
    }

    private updateStyle() {
        // Safely check if graphics objects still exist
        if (!this.bg || !this.text || !this.active) return;

        if (!this.enabled) {
            this.bg.setFillStyle(this.disabledColor);
            this.text.setColor(this.textDisabledColor);
        } else if (this.hovered) {
            this.bg.setFillStyle(this.hoverColor);
            this.text.setColor(this.textHoverColor);
        } else {
            this.bg.setFillStyle(this.normalColor);
            this.text.setColor(this.textNormalColor);
        }
    }
}
