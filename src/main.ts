import 'phaser';
import { GameConfig } from './config/GameConfig';

export const game = new Phaser.Game(GameConfig);
(window as any).game = game;
