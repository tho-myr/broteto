import { Character } from '../types';
import { CharacterFactory } from '../factory/CharacterFactory';

export const CHARACTERS: Character[] = [
    { 
        id: 'teto',
        name: 'Teto',
        description: 'Teto Word of the Day: Broteto <3',
        spriteKey: 'teto-sprite',
        spriteLocation: 'assets/teto.png',
        materialCollectionSoundKey: 'teto-mat-audio',
        materialCollectionSoundLocation: 'assets/characters/teto.mp3',
        startingStats: { speed: 10 },
        passivesDisplay: ['+10 Speed'],
        createPlayer: (scene, x, y, spriteKey) => CharacterFactory.createPlayer('teto', scene, x, y, spriteKey),
        onCollect: CharacterFactory.tetoOnCollect,
    },
    { 
        id: 'osaka', 
        name: 'Osaka', 
        description: 'OH MY GAH!',
        spriteKey: 'osaka-sprite',
        spriteLocation: 'assets/osaka.png',
        materialCollectionSoundKey: 'osaka-mat-audio',
        materialCollectionSoundLocation: 'assets/characters/osaka.mp3',
        startingStats: { maxHp: 10 },
        passivesDisplay: ['+2 Dumbness/HP', 'Dumbness->Dodge'],
        createPlayer: (scene, x, y, spriteKey) => CharacterFactory.createPlayer('osaka', scene, x, y, spriteKey),
        onCollect: CharacterFactory.osakaOnCollect,
    },
    {
        id: 'miku',
        name: 'Miku',
        description: 'Fires a beam when taking damage. Miku Miku BEAM!!!',
        spriteKey: 'miku-sprite',
        spriteLocation: 'assets/miku.png',
        materialCollectionSoundKey: 'miku-mat-audio',
        materialCollectionSoundLocation: 'assets/characters/miku.mp3',
        startingStats: { rangedDamage: 15 },
        passivesDisplay: ['+15 Ranged Dmg', 'Counter-Attack Beam'],
        createPlayer: (scene, x, y, spriteKey) => CharacterFactory.createPlayer('miku', scene, x, y, spriteKey),
        onCollect: CharacterFactory.mikuOnCollect,
        onDamageTaken: CharacterFactory.mikuOnDamageTaken,
    }
];
