var bootState = {
	create: function() {
		Game.physics.startSystem(Phaser.Physics.ARCADE);
		Game.state.start('load');
	}
};