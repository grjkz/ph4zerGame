var Game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area');

Game.state.add('boot',bootState);
Game.state.add('load',loadState);
Game.state.add('menu',menuState);
Game.state.add('play',playState);

Game.state.start('boot');