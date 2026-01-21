import { Scene } from 'phaser';
import { RunState, Item, Weapon, StatType } from '../types';
import { ITEMS, WEAPON_POOL } from '../data/items';

export class Shop extends Scene {
    private runState!: RunState;
    private shopItems: (Item | Weapon | null)[] = [];
    private shopPrices: (number | null)[] = [null, null, null, null];
    private locks: boolean[] = [false, false, false, false];
    
    // UI
    private currencyText!: Phaser.GameObjects.Text;
    private rerollBtn!: Phaser.GameObjects.Text;
    private itemContainers: Phaser.GameObjects.Container[] = [];
    private statTexts: Phaser.GameObjects.Text[] = [];
    private inventoryContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('Shop');
    }

    create(data: { runState: RunState }) {
        this.runState = data.runState;
        
        // Initialize Shop Persistence if missing
        if (!this.runState.shopState) {
            this.runState.shopState = {
                itemIds: [null, null, null, null],
                locks: [false, false, false, false],
                prices: [null, null, null, null]
            };
        }

        // Restore State
        this.locks = [...this.runState.shopState.locks];
        this.shopPrices = this.runState.shopState.prices ? [...this.runState.shopState.prices] : [null, null, null, null];
        
        // Restore Items from IDs
        this.shopItems = this.runState.shopState.itemIds.map((id, index) => {
            if (!id) {
                this.shopPrices[index] = null; // Ensure consistency
                return null;
            }
            const item = ITEMS.find(i => i.id === id);
            if (item) return item;
            const wep = WEAPON_POOL.find(w => w.id === id);
            return wep || null;
        });
        
        // Data fix: If we have an item but no price (e.g. valid load but missing price), calc it
        this.shopItems.forEach((item, i) => {
             if (item && this.shopPrices[i] === null) {
                 this.shopPrices[i] = this.calculatePrice(item.basePrice);
             }
        });

        this.itemContainers = [];
        this.statTexts = [];
        this.inventoryContainer = this.add.container(50, 320); // Moved up below stats

        this.createUI();
        
        // Initial roll only if empty (first time) or force reroll logic? 
        // Logic: On entering shop, if it's a "New Visit" (implied by create), we should Reroll the non-locked slots.
        
        this.reroll(true);
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
        if (this.runState.currency >= this.runState.rerollPrice) {
             this.runState.currency -= this.runState.rerollPrice;
             this.runState.rerollPrice += 1; // Price increase
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
        // Title
        this.add.text(640, 50, `SHOP - WAVE ${this.runState.wave}`, { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        
        // Currency
        this.currencyText = this.add.text(1000, 50, `Gold: ${this.runState.currency}`, { fontSize: '24px', color: '#ffd700' });
        
        // Stats Panel (Left)
        this.createStatsPanel();

        // Items Grid (Right/Center)
        for(let i=0; i<4; i++) {
             const container = this.add.container(400 + (i % 2)*320, 200 + Math.floor(i/2)*220);
             this.itemContainers.push(container);
        }

        // Reroll Button
        this.rerollBtn = this.add.text(640, 600, `Reroll (${this.runState.rerollPrice})`, { 
            fontSize: '28px', backgroundColor: '#333', padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.manualReroll());

        // Next Wave Button
        this.add.text(1000, 600, 'Next Wave >>', {
            fontSize: '28px', backgroundColor: '#006400', padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
             this.scene.start('Game', { runState: this.runState });
        });
        
        this.refreshUI();
    }
    
    createStatsPanel() {
        const startX = 50;
        const startY = 100;
        const statsToShow: StatType[] = ['maxHp', 'damage', 'meleeDamage', 'rangedDamage', 'speed', 'armor', 'luck'];
        
        this.add.text(startX, startY - 30, 'STATS', { fontSize: '24px', fontStyle: 'bold' });

        statsToShow.forEach((stat, idx) => {
             const t = this.add.text(startX, startY + idx*30, `${stat}: 0`, { fontSize: '18px', color: '#aaa' });
             this.statTexts.push(t);
        });
    }
    
    updateStatsUI() {
         const statsToShow: StatType[] = ['maxHp', 'damage', 'meleeDamage', 'rangedDamage', 'speed', 'armor', 'luck'];
         statsToShow.forEach((stat, idx) => {
             const val = this.runState.stats[stat];
             // Simple formatting
             this.statTexts[idx].setText(`${stat}: ${Math.floor(val)}`);
             this.statTexts[idx].setColor('#fff');
         });
    }

    updateCurrencyUI() {
        this.currencyText.setText(`Gold: ${this.runState.currency}`);
        this.rerollBtn.setText(`Reroll (${this.runState.rerollPrice})`);
    }

    updateInventoryUI() {
        this.inventoryContainer.removeAll(true);
        
        // Weapons Header
        const weaponCount = this.runState.weapons.length;
        const wHeader = this.add.text(0, 0, `WEAPONS (${weaponCount}/12)`, { fontSize: '20px', fontStyle: 'bold', color: '#fff' });
        this.inventoryContainer.add(wHeader);

        // List Weapons
        this.runState.weapons.forEach((wInst, idx) => {
            const weapon = WEAPON_POOL.find(w => w.id === wInst.weaponId);
            const name = weapon ? weapon.name : 'Unknown';
            const t = this.add.text(0, 30 + (idx * 25), `- ${name}`, { fontSize: '16px', color: '#ddd' });
            this.inventoryContainer.add(t);
        });

        // Items Header
        const itemsStartY = 30 + (this.runState.weapons.length * 25) + 20;
        const iHeader = this.add.text(0, itemsStartY, `ITEMS`, { fontSize: '20px', fontStyle: 'bold', color: '#fff' });
        this.inventoryContainer.add(iHeader);

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
            this.inventoryContainer.add(t);
            itemIdx++;
        });
    }

    refreshUI() {
        this.itemContainers.forEach((container, i) => {
            container.removeAll(true);
            const item = this.shopItems[i];
            const price = this.shopPrices[i];
            
            // Background
            const bg = this.add.rectangle(0, 0, 300, 200, 0x222222);
            bg.setStrokeStyle(2, this.locks[i] ? 0xff0000 : 0x000000);
            container.add(bg);

            if (item && price !== null) {
                // Name
                const name = this.add.text(0, -60, item.name, { fontSize: '22px', fontStyle: 'bold', color: '#d0021b' }).setOrigin(0.5);
                container.add(name);
                
                // Desc
                const desc = this.add.text(0, -20, item.description, { fontSize: '16px', color: '#ccc', wordWrap: { width: 280 } }).setOrigin(0.5);
                container.add(desc);
                
                // Type/Tags
                const tags = this.add.text(0, 10, item.tags.join(', '), { fontSize: '12px', color: '#888' }).setOrigin(0.5);
                container.add(tags);

                // Buy Button
                const canAfford = this.runState.currency >= price;
                const buyBtn = this.add.text(0, 60, `Buy ${price}`, {
                    fontSize: '24px', backgroundColor: canAfford ? '#008000' : '#444444', padding: { x:10, y:5 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                
                if (canAfford) {
                    buyBtn.on('pointerdown', () => this.buyItem(i));
                }
                container.add(buyBtn);
                
                // Lock Button
                const lockBtn = this.add.text(120, -80, this.locks[i] ? 'Locked' : 'Lock', {
                     fontSize: '14px', backgroundColor: this.locks[i] ? '#ff0000' : '#444'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                lockBtn.on('pointerdown', () => this.lockItem(i));
                container.add(lockBtn);

            } else {
                const sold = this.add.text(0, 0, 'SOLD', { fontSize: '24px', color: '#666' }).setOrigin(0.5);
                container.add(sold);
            }
        });
        
        this.updateStatsUI();
        this.updateCurrencyUI();
        this.updateInventoryUI();
    }
}
