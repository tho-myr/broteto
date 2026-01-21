import { Character } from '../types';

export const CHARACTERS: Character[] = [
    { 
        id: 'teto_classic', 
        name: 'Classic Teto', 
        description: 'Speedy.', 
        spriteKey: 'teto',
        startingStats: { speed: 10 },
        startingWeaponId: 'stick',
        passivesDisplay: ['+10 Speed']
    },
    { 
        id: 'teto_chimera', 
        name: 'Chimera Teto', 
        description: 'Strong but slow.', 
        spriteKey: 'teto', // Placeholder
        startingStats: { meleeDamage: 10, maxHp: 30, speed: -10 },
        startingWeaponId: 'stick',
        passivesDisplay: ['+10 Melee Dmg', '+10 HP', '-10 Speed']
    },
    { 
        id: 'teto_sv', 
        name: 'SynthV Teto', 
        description: 'High Tech.', 
        spriteKey: 'teto', // Placeholder
        startingStats: { range: 50, critChance: 10 },
        startingWeaponId: 'pistol',
        passivesDisplay: ['+50 Range', '+10 Crit']
    }
];
