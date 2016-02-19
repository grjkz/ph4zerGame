var menuState = {
	create: function() {
		// render menu stuff here
		Game.add.text(80,80, 'My First Game', {font: '50px Arial', fill: 'orange'});
		var wkey = Game.input.keyboard.addKey(Phaser.Keyboard.W);
		wkey.onDown.addOnce(function() {Game.add.text(100,100, 'Initiated', {font: '50px Arial', fill: 'orange'});});
	},

	start: function() {
		// Game.state.start('play');
	}
};