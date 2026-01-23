import { Scene } from 'phaser';
import { RunState, Item, Weapon, StatType } from '../types';
import { ITEMS, WEAPON_POOL } from '../data/items';
import { GamepadManager } from '../systems/GamepadManager';
import { Button, InputModeManager } from '../ui/Button';
import ScrollView from '../ui/ScrollView';

interface ShopItemUI {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Rectangle;
    buyBtn?: Button;
    lockBtn?: Button;
    soldText?: Phaser.GameObjects.Text;
}

export class Shop extends Scene {
    private runState!: RunState;
    private shopItems: (Item | Weapon | null)[] = [];
    private shopPrices: (number | null)[] = [null, null, null, null];
    private locks: boolean[] = [false, false, false, false];
    
    // UI
    private currencyText!: Phaser.GameObjects.Text;
    private rerollBtn!: Button;
    private nextWaveBtn!: Button;
    private shopItemsUI: ShopItemUI[] = [];

    private leftContainer!: ScrollView; // Inventory
    private rightContainer!: ScrollView; // Stats

    // Controller
    private gamepadManager!: GamepadManager;
    private selectedItem: number = 0; // Currently selected shop item (0-3)
    private inputCooldown: number = 0;
    private cooldownDuration: number = 150;

    constructor() {
        super('Shop');
    }

    create(data: { runState: RunState }) {
        this.runState = data.runState;
        
        // Initialize GamepadManager
        this.gamepadManager = new GamepadManager();
        this.selectedItem = 0;
        this.inputCooldown = 0;

        // ...existing code...
        const resumingShopSession = !!this.runState.inShop;

        // Initialize Shop Persistence if missing
        if (!this.runState.shopState) {
            this.runState.shopState = {
                itemIds: [null, null, null, null],
                locks: [false, false, false, false],
                prices: [null, null, null, null]
            };
        }

        // Mark as being in shop NOW
        this.runState.inShop = true;

        // Restore State
        this.locks = [...this.runState.shopState.locks];
        this.shopPrices = this.runState.shopState.prices ? [...this.runState.shopState.prices] : [null, null, null, null];
        
        // Restore Items from IDs
        this.shopItems = this.runState.shopState.itemIds.map((id) => {
            if (!id) {
                return null;
            }
            const item = ITEMS.find(i => i.id === id);
            if (item) return item;
            const wep = WEAPON_POOL.find(w => w.id === id);
            return wep || null;
        });
        
        // Data fix: If we have an item but no price
        this.shopItems.forEach((item, i) => {
             if (item && this.shopPrices[i] === null) {
                 this.shopPrices[i] = this.calculatePrice(item.basePrice);
             }
        });

        // Initialize ScrollViews
        this.leftContainer = new ScrollView(this, 20, 100, 300, this.scale.height - 150);
        this.rightContainer = new ScrollView(this, this.scale.width - 320, 100, 300, this.scale.height - 150);

        this.createUI();
        
        // Reroll Logic
        if (!resumingShopSession) {
             this.reroll(true);
        } else {
             this.refreshUI();
        }

        this.saveGame();
    }

    calculatePrice(basePrice: number): number {
        const wave = this.runState.wave;
        // Scale item prices with wave count. (Price scaling > Range scaling)
        // Base Price factor: +10% per wave
        const wavePriceFactor = 1 + (wave * 0.10); 
        
        // Range scale: +5% per wave
        const rangeBase = 5;
        const rangeFactor = 1 + (wave * 0.05);
        const range = Math.floor(rangeBase * rangeFactor);
        
        // Random offset between -range and +range
        const offset = Phaser.Math.Between(-range, range);
        
        let finalPrice = Math.floor((basePrice * wavePriceFactor) + offset);
        return Math.max(1, finalPrice);
    }
    
    saveGame() {
        // Simple save to single slot for now
        localStorage.setItem('broteto_save_1', JSON.stringify({
             version: 1,
             activeRun: this.runState
        }));
        console.log('Game Saved');
    }

    reroll(free: boolean = false) {
        if (!free && this.runState.currency < this.runState.rerollPrice) {
            return; // Can't afford
        }

        const pool = [...ITEMS, ...WEAPON_POOL];
        
        for (let i = 0; i < 4; i++) {
            if (!this.locks[i]) {
                const randomItem = pool[Math.floor(Math.random() * pool.length)];
                this.shopItems[i] = randomItem;
                this.shopPrices[i] = this.calculatePrice(randomItem.basePrice);
            }
        }
        
        // Sync to RunState
        this.updateShopState();
        
        this.refreshUI();
    }

    updateShopState() {
        if (!this.runState.shopState) return;
        this.runState.shopState.itemIds = this.shopItems.map(i => i ? i.id : null);
        this.runState.shopState.locks = [...this.locks];
        this.runState.shopState.prices = [...this.shopPrices];
    }


    manualReroll() {
        const isShopEmpty = this.shopItems.every(item => item === null);
        const price = isShopEmpty ? 0 : this.runState.rerollPrice;

        if (this.runState.currency >= price) {
             this.runState.currency -= price;
             if (!isShopEmpty) {
                this.runState.rerollPrice += 1; // Price only increases if not the free empty-shop reroll
             }
             this.reroll(true);
             this.updateCurrencyUI();
        }
    }

    buyItem(index: number) {
        const item = this.shopItems[index];
        const price = this.shopPrices[index];
        
        if (!item || price === null) return;
        
        if ((item as any).weaponStats && this.runState.weapons.length >= 12) {
            // Limit reached
            return;
        }

        if (this.runState.currency >= price) {
            this.runState.currency -= price;
            
            // Add to inventory/stats
            if ((item as any).weaponStats) { // Duck typing check
                const w = item as Weapon;
                this.runState.weapons.push({ weaponId: w.id, instanceId: Date.now().toString() + Math.random() });
            } else {
                // Item
                const it = item as Item;
                this.runState.items.push(it.id);
                it.modifiers.forEach(mod => {
                    this.runState.stats[mod.stat] = (this.runState.stats[mod.stat] || 0) + mod.value;
                });
            }

            // Mark sold
            this.shopItems[index] = null; 
            this.shopPrices[index] = null;
            this.locks[index] = false; 
            
            // Sync
            this.updateShopState();

            this.refreshUI();
            this.updateCurrencyUI();
            this.saveGame();
        }
    }
    
    lockItem(index: number) {
        if(this.shopItems[index] === null) return;
        this.locks[index] = !this.locks[index];
        this.updateShopState();
        this.refreshUI();
    }

    createUI() {
        const w = this.scale.width;

        // Title
        this.add.text(w/2, 50, `SHOP - WAVE ${this.runState.wave}`, { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        
        // Currency
        this.currencyText = this.add.text(w - 150, 50, `Gold: ${this.runState.currency}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);
        
        // Items Grid (Center)
        const gridStartX = (w / 2) - 310;
        this.shopItemsUI = [];

        for(let i=0; i<4; i++) {
             const x = gridStartX + (i % 2) * 320 + 150;
             const y = 200 + Math.floor(i/2) * 220;
             const container = this.add.container(x, y);

             const bg = this.add.rectangle(0, 0, 300, 200, 0x222222);
             bg.setStrokeStyle(2, 0x000000);
             container.add(bg);

             this.shopItemsUI.push({ container, bg });
        }

        // Reroll Button
        this.rerollBtn = new Button(this, {
            x: w/2,
            y: 650,
            text: `Reroll (${this.runState.rerollPrice})`,
            onClick: () => this.manualReroll()
        });
        this.rerollBtn.setNormalColor(0x333333);

        // Next Wave Button
        this.nextWaveBtn = new Button(this, {
            x: w - 150,
            y: 650,
            text: 'Next Wave >>',
            onClick: () => {
                 this.runState.inShop = false;
                 this.saveGame();
                 this.scene.start('Game', { runState: this.runState });
            }
        });
        this.nextWaveBtn.setNormalColor(0x006400);

        this.refreshUI();
    }
    
    updateStatsUI() {
         this.rightContainer.removeAllContent();
         
         const allStats: StatType[] = [
             'maxHp', 'hpRegen', 'lifesteal', 'damage', 'meleeDamage', 'rangedDamage', 
             'elementalDamage', 'attackSpeed', 'critChance', 'speed', 'armor', 
             'range', 'luck', 'harvest', 'dudge', 'pickupRange'
         ];
         
         const header = this.add.text(0, 0, 'STATS', { fontSize: '24px', fontStyle: 'bold' });
         this.rightContainer.addContent(header);
         
         allStats.forEach((stat, idx) => {
             // Handle typo in dudge if necessary
             const key = stat as keyof typeof this.runState.stats;
             let val = this.runState.stats[key] || 0;
             
             // Format
             let displayVal = val.toString();
             if (['critChance', 'lifesteal', 'dudge'].includes(stat)) {
                // assume stored as whole num for %? Or checking StatManager? Usually float 0.05
                // User didn't specify units. Let's assume standard formatting. 
                // If it's small float, show %. 
                if (Math.abs(val) <= 2 && val !== 0 && val % 1 !== 0) {
                     displayVal = Math.floor(val * 100) + '%';
                }
             }

             const t = this.add.text(0, 40 + idx*30, `${stat}: ${displayVal}`, { fontSize: '18px', color: '#fff' });
             this.rightContainer.addContent(t);
         });
    }

    updateCurrencyUI() {
        this.currencyText.setText(`Gold: ${this.runState.currency}`);
        
        const isShopEmpty = this.shopItems.every(item => item === null);
        const price = isShopEmpty ? 0 : this.runState.rerollPrice;
        
        this.rerollBtn.setText(`Reroll (${price})`);
    }

    updateInventoryUI() {
        this.leftContainer.removeAllContent();
        
        // Weapons Header
        const weaponCount = this.runState.weapons.length;
        const wHeader = this.add.text(0, 0, `WEAPONS (${weaponCount}/12)`, { fontSize: '20px', fontStyle: 'bold', color: '#fff' });
        this.leftContainer.addContent(wHeader);

        // List Weapons
        this.runState.weapons.forEach((wInst, idx) => {
            const weapon = WEAPON_POOL.find(w => w.id === wInst.weaponId);
            const name = weapon ? weapon.name : 'Unknown';
            const t = this.add.text(0, 30 + (idx * 25), `- ${name}`, { fontSize: '16px', color: '#ddd' });
            this.leftContainer.addContent(t);
        });

        // Items Header
        const itemsStartY = 30 + (this.runState.weapons.length * 25) + 20;
        const iHeader = this.add.text(0, itemsStartY, `ITEMS`, { fontSize: '20px', fontStyle: 'bold', color: '#fff' });
        this.leftContainer.addContent(iHeader);

        // List Items
        const itemCounts: Record<string, number> = {};
        this.runState.items.forEach(id => {
            itemCounts[id] = (itemCounts[id] || 0) + 1;
        });

        let itemIdx = 0;
        Object.entries(itemCounts).forEach(([id, count]) => {
            const item = ITEMS.find(i => i.id === id);
            const name = item ? item.name : id;
            const textStr = count > 1 ? `${name} x${count}` : name;
            const t = this.add.text(0, itemsStartY + 30 + (itemIdx * 25), `- ${textStr}`, { fontSize: '16px', color: '#ddd' });
            this.leftContainer.addContent(t);
            itemIdx++;
        });
    }

    refreshUI() {
        this.shopItemsUI.forEach((ui, i) => {
            ui.container.removeAll(true);
            const item = this.shopItems[i];
            const price = this.shopPrices[i];
            
            // Background - no yellow highlight, just normal box
            ui.bg = this.add.rectangle(0, 0, 300, 200, 0x222222);
            ui.bg.setStrokeStyle(2, this.locks[i] ? 0xff0000 : 0xffffff);
            ui.container.add(ui.bg);

            if (item && price !== null) {
                // Name
                const name = this.add.text(0, -60, item.name, { fontSize: '22px', fontStyle: 'bold', color: '#d0021b' }).setOrigin(0.5);
                ui.container.add(name);

                // Desc
                const desc = this.add.text(0, -20, item.description, { fontSize: '16px', color: '#ccc', wordWrap: { width: 280 } }).setOrigin(0.5);
                ui.container.add(desc);

                // Type/Tags
                const tags = this.add.text(0, 10, item.tags.join(', '), { fontSize: '12px', color: '#888' }).setOrigin(0.5);
                ui.container.add(tags);

                // Buy Button
                const canAfford = this.runState.currency >= price;
                ui.buyBtn = new Button(this, {
                    x: 0,
                    y: 60,
                    width: 150,
                    height: 40,
                    fontSize: '20px',
                    text: `Buy ${price}`,
                    onClick: () => this.buyItem(i),
                    enabled: canAfford
                });
                ui.buyBtn.setNormalColor(canAfford ? 0x008000 : 0x444444);

                // Highlight buy button ONLY if selected
                if (this.selectedItem === i) {
                    ui.buyBtn.highlight();
                }

                ui.container.add(ui.buyBtn);

                // Lock Button - Square button on PS5 (X button code 2)
                const lockText = this.locks[i] ? '[◻ Unlock]' : '[◻ Lock]';
                const lockBtn = this.add.text(0, -80, lockText, {
                    fontSize: '14px',
                    color: this.locks[i] ? '#ffff00' : '#ffffff',
                    backgroundColor: this.locks[i] ? '#ff6600' : '#444444',
                    padding: { x: 8, y: 4 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                
                lockBtn.on('pointerdown', () => {
                    this.sound.play('press');
                    this.lockItem(i);
                });

                ui.container.add(lockBtn);
            } else {
                const sold = this.add.text(0, 0, 'SOLD', { fontSize: '24px', color: '#666' }).setOrigin(0.5);
                ui.container.add(sold);
            }
        });
        
        this.updateStatsUI();
        this.updateCurrencyUI();
        this.updateInventoryUI();
    }

    update(delta: number) {
        // Detect gamepad input - switch to controller mode
        if (this.gamepadManager.isConnected()) {
            const dpad = this.gamepadManager.getDPadInput();
            const leftStick = this.gamepadManager.getLeftStickInput();
            if (dpad.x !== 0 || dpad.y !== 0 || Math.abs(leftStick.x) > 0.5 || Math.abs(leftStick.y) > 0.5 ||
                this.gamepadManager.isButtonDown('A') || this.gamepadManager.isButtonDown('X')) {
                InputModeManager.setMode('controller');
            }
        }

        this.inputCooldown -= delta;
        if (this.inputCooldown > 0) return;

        // Handle D-pad/Analog stick for navigation
        const dpad = this.gamepadManager.getDPadInput();
        const leftStick = this.gamepadManager.getLeftStickInput();

        // Check for left/right input
        let moveX = dpad.x;
        if (Math.abs(leftStick.x) > 0.5) {
            moveX = leftStick.x > 0 ? 1 : -1;
        }

        if (moveX !== 0) {
            this.selectedItem = (this.selectedItem + Math.sign(moveX) + 4) % 4;
            this.refreshUI();
            this.inputCooldown = this.cooldownDuration;
        }

        // Check for up/down input
        let moveY = dpad.y;
        if (Math.abs(leftStick.y) > 0.5) {
            moveY = leftStick.y > 0 ? 1 : -1;
        }

        if (moveY !== 0) {
            const newItem = (this.selectedItem + Math.sign(moveY) * 2 + 4) % 4;
            if (newItem !== this.selectedItem) {
                this.selectedItem = newItem;
                this.refreshUI();
                this.inputCooldown = this.cooldownDuration;
            }
        }

        // Handle A button to buy
        if (this.gamepadManager.isButtonDown('A')) {
            const item = this.shopItems[this.selectedItem];
            if (item && this.runState.currency >= (this.shopPrices[this.selectedItem] || 0)) {
                this.buyItem(this.selectedItem);
            }
            this.inputCooldown = this.cooldownDuration;
        }

        // Handle X (Square) button to lock/unlock
        if (this.gamepadManager.isButtonDown('X')) {
            this.lockItem(this.selectedItem);
            this.inputCooldown = this.cooldownDuration;
        }
    }
}
