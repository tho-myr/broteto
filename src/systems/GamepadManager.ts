export class GamepadManager {
    private gamepads: Gamepad[] = [];
    private deadzone: number = 0.1;
    private previousButtonStates: Map<number, boolean[]> = new Map();

    // Button mappings (standard gamepad layout)
    private readonly BUTTONS = {
        A: 0,
        B: 1,
        X: 2,
        Y: 3,
        LB: 4,
        RB: 5,
        LT: 6,
        RT: 7,
        SELECT: 8,
        START: 9,
        LEFT_STICK: 10,
        RIGHT_STICK: 11,
        HOME: 16
    };

    // Analog sticks
    private readonly AXES = {
        LEFT_STICK_X: 0,
        LEFT_STICK_Y: 1,
        RIGHT_STICK_X: 2,
        RIGHT_STICK_Y: 3,
        LT: 4,
        RT: 5
    };

    constructor(deadzone: number = 0.1) {
        this.deadzone = deadzone;
        this.updateGamepadList();
        window.addEventListener('gamepadconnected', () => this.updateGamepadList());
        window.addEventListener('gamepaddisconnected', () => this.updateGamepadList());
    }

    private updateGamepadList(): void {
        const gamepads = navigator.getGamepads();
        this.gamepads = [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepads.push(gamepads[i]!);
            }
        }
    }

    private applyDeadzone(value: number): number {
        if (Math.abs(value) < this.deadzone) {
            return 0;
        }
        return (Math.abs(value) - this.deadzone) / (1 - this.deadzone) * Math.sign(value);
    }

    /**
     * Get the input vector from the left analog stick of the first connected gamepad
     * Returns a normalized vector (-1 to 1 on each axis)
     */
    public getLeftStickInput(): { x: number; y: number } {
        this.updateGamepadList();
        if (this.gamepads.length === 0) {
            return { x: 0, y: 0 };
        }

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.axes) {
            return { x: 0, y: 0 };
        }

        let x = this.applyDeadzone(gamepad.axes[this.AXES.LEFT_STICK_X] || 0);
        let y = this.applyDeadzone(gamepad.axes[this.AXES.LEFT_STICK_Y] || 0);

        return { x, y };
    }

    /**
     * Get the input vector from the right analog stick
     */
    public getRightStickInput(): { x: number; y: number } {
        this.updateGamepadList();
        if (this.gamepads.length === 0) {
            return { x: 0, y: 0 };
        }

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.axes) {
            return { x: 0, y: 0 };
        }

        let x = this.applyDeadzone(gamepad.axes[this.AXES.RIGHT_STICK_X] || 0);
        let y = this.applyDeadzone(gamepad.axes[this.AXES.RIGHT_STICK_Y] || 0);

        return { x, y };
    }

    /**
     * Get the D-pad input as a vector
     */
    public getDPadInput(): { x: number; y: number } {
        this.updateGamepadList();
        if (this.gamepads.length === 0) {
            return { x: 0, y: 0 };
        }

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.buttons) {
            return { x: 0, y: 0 };
        }

        let x = 0;
        let y = 0;

        // D-pad buttons (12-15)
        if (gamepad.buttons[12]?.pressed) y -= 1; // Up
        if (gamepad.buttons[13]?.pressed) y += 1; // Down
        if (gamepad.buttons[14]?.pressed) x -= 1; // Left
        if (gamepad.buttons[15]?.pressed) x += 1; // Right

        return { x, y };
    }

    /**
     * Check if a button is currently pressed
     */
    public isButtonPressed(buttonCode: keyof typeof this.BUTTONS): boolean {
        this.updateGamepadList();
        if (this.gamepads.length === 0) return false;

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.buttons) return false;

        const buttonIndex = this.BUTTONS[buttonCode];
        return gamepad.buttons[buttonIndex]?.pressed || false;
    }

    /**
     * Check if a button was just pressed (pressed this frame but not last frame)
     */
    public isButtonDown(buttonCode: keyof typeof this.BUTTONS): boolean {
        this.updateGamepadList();
        if (this.gamepads.length === 0) return false;

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.buttons) return false;

        const buttonIndex = this.BUTTONS[buttonCode];
        const isPressed = gamepad.buttons[buttonIndex]?.pressed || false;

        // Get previous state
        const gamepadId = gamepad.index;
        if (!this.previousButtonStates.has(gamepadId)) {
            this.previousButtonStates.set(gamepadId, []);
        }

        const previousStates = this.previousButtonStates.get(gamepadId)!;
        const wasPressedBefore = previousStates[buttonIndex] || false;

        // Update previous state
        previousStates[buttonIndex] = isPressed;

        // Return true only if just pressed
        return isPressed && !wasPressedBefore;
    }

    /**
     * Get trigger values (0 to 1)
     */
    public getLeftTrigger(): number {
        this.updateGamepadList();
        if (this.gamepads.length === 0) return 0;

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.axes) return 0;

        // Some gamepads use axes 4-5, others use buttons 6-7
        const triggerValue = gamepad.axes[this.AXES.LT] || 0;
        return (triggerValue + 1) / 2; // Convert from -1 to 1 to 0 to 1
    }

    public getRightTrigger(): number {
        this.updateGamepadList();
        if (this.gamepads.length === 0) return 0;

        const gamepad = this.gamepads[0];
        if (!gamepad || !gamepad.axes) return 0;

        const triggerValue = gamepad.axes[this.AXES.RT] || 0;
        return (triggerValue + 1) / 2; // Convert from -1 to 1 to 0 to 1
    }

    /**
     * Check if any gamepad is connected
     */
    public isConnected(): boolean {
        this.updateGamepadList();
        return this.gamepads.length > 0;
    }

    /**
     * Get the number of connected gamepads
     */
    public getConnectedCount(): number {
        this.updateGamepadList();
        return this.gamepads.length;
    }

    /**
     * Set the deadzone threshold (0 to 1)
     */
    public setDeadzone(value: number): void {
        this.deadzone = Math.max(0, Math.min(1, value));
    }

    /**
     * Vibrate the gamepad (if supported)
     * @param intensity The vibration intensity (0 to 1)
     * @param duration The vibration duration in milliseconds
     */
    public vibrate(intensity: number = 1, duration: number = 100): void {
        this.updateGamepadList();
        if (this.gamepads.length === 0) return;

        const gamepad = this.gamepads[0];
        if (!gamepad || !('vibrationActuator' in gamepad)) return;

        const actuator = (gamepad as any).vibrationActuator;
        if (actuator && typeof actuator.playEffect === 'function') {
            actuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity,
                strongMagnitude: intensity
            }).catch((e: any) => {
                console.warn('Vibration not supported:', e);
            });
        }
    }

    /**
     * Clean up event listeners
     */
    public destroy(): void {
        window.removeEventListener('gamepadconnected', () => this.updateGamepadList());
        window.removeEventListener('gamepaddisconnected', () => this.updateGamepadList());
    }
}
