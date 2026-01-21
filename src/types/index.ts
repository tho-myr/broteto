
// Basic Stats
export type StatType = 
    | 'maxHp' 
    | 'hpRegen' 
    | 'lifesteal' 
    | 'damage' // % damage
    | 'meleeDamage' 
    | 'rangedDamage' 
    | 'elementalDamage' 
    | 'attackSpeed' 
    | 'critChance' 
    | 'dudge' 
    | 'speed' 
    | 'armor' 
    | 'range' 
    | 'luck' 
    | 'harvest'
    | 'pickupRange';

export interface StatModifier {
    stat: StatType;
    value: number; // e.g. 5 for +5, 0.1 for +10% usually handled by context
    isPercentage?: boolean;
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

export interface Item {
    id: string;
    name: string;
    description: string;
    icon?: string;
    rarity: Rarity;
    basePrice: number;
    tags: string[];
    modifiers: StatModifier[];
    limit?: number; // Max amount you can carry
}

export interface WeaponStats {
    damage: number;
    cooldown: number; // ms
    range: number;
    knockback: number;
    projectileSpeed?: number;
    duration?: number;
    penetration?: number; // 0 for infinite? or N hits
    scaling: Partial<Record<StatType, number>>; // e.g. { meleeDamage: 1.0 }
}

export interface Weapon extends Item {
    type: 'Melee' | 'Ranged';
    weaponStats: WeaponStats;
    projectileKey?: string; // Image for projectile
}

export interface Character {
    id: string;
    name: string;
    description: string;
    spriteKey: string;
    startingStats: Partial<Record<StatType, number>>;
    startingWeaponId: string; // ID of default weapon
    passivesDisplay: string[];
}

export interface EnemyStats {
    hp: number;
    speed: number;
    damage: number;
    xpValue: number;
}

export interface WaveConfig {
    waveNumber: number;
    duration: number; // seconds
    enemies: {
        enemyId: string;
        rate: number; // spawn every X seconds or chance
        minCount?: number;
    }[];
}

// Save Data Structures
export interface RunState {
    characterId: string;
    wave: number;
    currency: number;
    currentHp: number;
    xp: number;
    level: number;
    stats: Record<StatType, number>;
    items: string[]; // List of Item IDs
    weapons: {
        weaponId: string;
        instanceId: string; // Unique for tracking cooldowns if needed, or just array
    }[];
    // Shop Persistence
    shopState?: {
        itemIds: (string | null)[];
        locks: boolean[];
        prices?: (number | null)[]; // Persisted Prices
    };
    rerollPrice: number;
}

export interface Settings {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
}

export interface SaveFile {
    version: number;
    settings: Settings;
    globalUnlocks: string[];
    activeRun: RunState | null;
}
