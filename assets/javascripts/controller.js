var game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area')

game.state.add('boot',bootState)
game.state.add('load',loadState)
game.state.add('menu',menuState)
game.state.add('play',playState)

game.state.start('boot')