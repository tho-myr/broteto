import { Character, Item, RunState, StatType, WeaponStats } from '../types';

export class StatManager {
    static getBaseStats(): Record<StatType, number> {
        return {
            maxHp: 10,
            hpRegen: 0,
            lifesteal: 0,
            damage: 20,       // % Increased base damage
            meleeDamage: 0,  // Flat
            rangedDamage: 0, // Flat
            elementalDamage: 0, // Flat
            attackSpeed: 0,  // %
            critChance: 0,   // %
            dudge: 0,        // %
            speed: 0,        // %
            armor: 0,
            range: 0,
            luck: 0,
            harvest: 0,
            pickupRange: 100 // Base pickup range
        };
    }

    static calculateStats(_runState: RunState, character: Character | null, items: Item[]): Record<StatType, number> {
        const stats = { ...this.getBaseStats() };

        // Apply Character Starting Stats
        if (character) {
             for (const [key, value] of Object.entries(character.startingStats)) {
                if (value !== undefined) {
                    stats[key as StatType] += value;
                }
             }
        }

        // Apply Items
        // Note: In Brotato, items modify the base stats directly usually.
        // We will assume runState.items holds IDs, but here we expect full Item objects for calculation. 
        // In a real app, we might just mutate runState.stats incrementally. 
        // For robustness, recalculating from source is safer.
        
        items.forEach(item => {
            item.modifiers.forEach(mod => {
                stats[mod.stat] += mod.value;
            });
        });

        // Osaka Special Passive
        if (character && character.id === 'osaka') {
            const dumbness = stats.maxHp * 2;
            // Hyperbolic scale to 60. k=50 for "quick start"
            // At 10 HP -> 20 Dumbness -> (60*20)/(70) = 17%
            // At 50 HP -> 100 Dumbness -> (60*100)/(150) = 40%
            const dodgeOffset = (60 * dumbness) / (dumbness + 50);
            stats.dudge += dodgeOffset;
        }

        return stats;
    }

    static getWeaponCooldown(weaponStats: WeaponStats, currentStats: Record<StatType, number>): number {
        // Attack Speed reduces cooldown. 
        // +50% attack speed = 1.5x attacks per second = 1/1.5 cooldown duration.
        // Formula: base / (1 + attackSpeed/100)
        // Attack speed is usually stored as a generic percentage integer e.g. 50
        const speedMultiplier = 1 + (currentStats.attackSpeed / 100);
        // Cap speed reduction?
        return weaponStats.cooldown / Math.max(0.1, speedMultiplier);
    }

    static getWeaponDamage(weaponStats: WeaponStats, currentStats: Record<StatType, number>): number {
        // Base Damage + Scaling
        // Scaling: { meleeDamage: 0.5 } means +50% of your Melee Damage Stat
        
        let bonus = 0;
        for (const [stat, ratio] of Object.entries(weaponStats.scaling)) {
             const statValue = currentStats[stat as StatType] || 0;
             bonus += statValue * ratio;
        }

        const totalDamage = (weaponStats.damage + bonus) * (1 + currentStats.damage / 100);
        return Math.floor(Math.max(1, totalDamage));
    }

    static getWeaponRange(weaponStats: WeaponStats, currentStats: Record<StatType, number>): number {
        return weaponStats.range + currentStats.range;
    }
}
