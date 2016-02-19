var menuState = {
	create: function() {
		// render menu stuff here
		Game.add.text(80,80, 'Enter your Alias', {font: '50px Arial', fill: 'orange'});
		document.getElementById('alias-form').style.visibility = 'visible';

		// submit alias to server
		document.getElementsByClassName('alias-form')[0].addEventListener("submit", function(e) {
			e.preventDefault();

			var alias = document.getElementsByClassName('alias')[0].value.trim();
			if (alias) {
				socket.emit('add alias', {alias: alias});
				this.style.visibility = 'hidden';
			}

		});
		// start playState when the OK from server has been receieved
		socket.on('start playState', function() {
			this.start();
		}.bind(this));
	},

	start: function() {
		Game.state.start('play');
	}
};