import { Boot } from '../scenes/Boot';
import { Game } from '../scenes/Game';
import { Menu } from '../scenes/Menu';
import { Preload } from '../scenes/Preload';
import { Shop } from '../scenes/Shop';
import { CharacterSelection } from '../scenes/CharacterSelection';
import { WeaponSelection } from '../scenes/WeaponSelection';
import { Pause } from '../scenes/Pause';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  backgroundColor: '#1a1a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top down, no gravity
      debug: false
    }
  },
  scene: [Boot, Preload, Menu, CharacterSelection, WeaponSelection, Game, Shop, Pause],
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
