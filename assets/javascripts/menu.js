var menuState = {
	create: function() {
		// render menu stuff here
		game.add.text(80,80, 'My First Game', {font: '50px Arial', fill: '#ffffff'})
		var wkey = game.input.keyboard.addKey(Phaser.Keyboard.W);
		wkey.onDown.addOnce(this.start, this);
	},

	start: function() {
		game.state.start('play')
	}
}