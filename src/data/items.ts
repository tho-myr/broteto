import { Weapon, Item } from '../types';

export const STARTER_WEAPON: Weapon = {
    id: 'stick',
    name: 'Stick',
    rarity: 'Common',
    basePrice: 10,
    tags: ['Primitive', 'Melee'],
    description: 'A simple stick.',
    modifiers: [],
    type: 'Melee',
    weaponStats: {
        damage: 10,
        cooldown: 800,
        range: 120, // Pixel range
        knockback: 20,
        scaling: { meleeDamage: 0.5 }
    },
    icon: 'weapon_stick'
};

export const PISTOL_WEAPON: Weapon = {
    id: 'pistol',
    name: 'Pistol',
    rarity: 'Common',
    basePrice: 15,
    tags: ['Gun', 'Ranged'],
    description: 'Pew pew.',
    modifiers: [],
    type: 'Ranged',
    weaponStats: {
        damage: 5,
        cooldown: 500,
        range: 400,
        knockback: 10,
        projectileSpeed: 600,
        scaling: { rangedDamage: 0.8 },
        duration: 2000
    },
    icon: 'weapon_stick', // Placeholder set in Preload
    projectileKey: 'bullet'
};

export const ITEMS: Item[] = [
    {
        id: 'coffee', name: 'Coffee', rarity: 'Common', basePrice: 15, tags: ['Food'], description: '+10 Speed, -2% Damage',
        modifiers: [{ stat: 'speed', value: 10 }, { stat: 'damage', value: -2 }]
    },
    {
        id: 'dumbbell', name: 'Dumbbell', rarity: 'Uncommon', basePrice: 30, tags: ['Gym'], description: '+5 Melee Dmg',
        modifiers: [{ stat: 'meleeDamage', value: 5 }]
    },
    {
        id: 'scope', name: 'Sniper Scope', rarity: 'Rare', basePrice: 60, tags: ['Tech'], description: '+50 Range, +5 Crit',
        modifiers: [{ stat: 'range', value: 50 }, { stat: 'critChance', value: 5 }]
    },
    {
        id: 'armor_plate', name: 'Armor Plate', rarity: 'Common', basePrice: 20, tags: ['Defense'], description: '+3 Armor',
        modifiers: [{ stat: 'armor', value: 3 }]
    },
    {
        id: 'baguette', name: 'Baguette', rarity: 'Common', basePrice: 10, tags: ['Food'], description: '+20 HP',
        modifiers: [{ stat: 'maxHp', value: 20 }]
    },
    {
        id: 'dynamite', name: 'Dynamite', rarity: 'Uncommon', basePrice: 40, tags: ['Explosive'], description: '+15% Damage',
        modifiers: [{ stat: 'damage', value: 15 }]
    }
];

export const WEAPON_POOL: Weapon[] = [
    STARTER_WEAPON,
    PISTOL_WEAPON
];
