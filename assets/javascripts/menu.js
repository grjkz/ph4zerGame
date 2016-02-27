var menuState = {
	create: function() {
		// show alias form
		document.getElementsByClassName('alias-form')[0].style.visibility = 'visible';

		// render menu stuff here
		Game.add.text(400,130, 'Enter your Alias', {font: '70px Arial', fill: 'orange'});
		Game.add.text(590,250, 'max 12 characters', {font: '12px Arial', fill: '#777777'});
		document.getElementById('alias-form').style.visibility = 'visible';

		// submit alias to server
		document.getElementsByClassName('alias-form')[0].addEventListener("submit", function(e) {
			e.preventDefault();

			var alias = document.getElementsByClassName('alias')[0].value.trim();
			if (!alias) {
				alias = "Noob";
			}
			else if (alias.length > 13) {
				alias = alias.substring(0,12);
			}
			socket.emit('add alias', {alias: alias});
			this.style.visibility = 'hidden';
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