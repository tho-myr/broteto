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
        id: 'osaka', 
        name: 'Osaka', 
        description: 'OH MY GAH!', 
        spriteKey: 'osaka',
        startingStats: { maxHp: 10 },
        startingWeaponId: 'pistol',
        passivesDisplay: ['+2 Dumbness/HP', 'Dumbness->Dodge']
    },
    {
        id: 'miku',
        name: 'Miku',
        description: 'Fires a beam when taking damage.',
        spriteKey: 'miku',
        startingStats: { rangedDamage: 15 },
        startingWeaponId: 'pistol', // Or 'leek' if we had it
        passivesDisplay: ['+15 Ranged Dmg', 'Counter-Attack Beam']
    }
];
