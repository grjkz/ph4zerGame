
// gets own id and info
socket.on('player info', function(data) {
	gold_coins.create(0,0,'gold_coin')
	myInfo = data
	// console.log(data)
	spawnPlayer(data.x, data.y)
	console.log('my user info was received')
})

// a new player joins
socket.on('add new user', function(player) {
	Players[player.id] = player
	Players.counter++

	var opponent = game.add.sprite(player.x, player.y, 'sship');
	// opponent.weapons = []
	opponent.animations.add('right',[0],1,true);
	opponent.animations.add('down',[1],1,true);
	opponent.animations.add('left',[2],1,true);
	opponent.animations.add('up',[3],1,true);
	game.physics.arcade.enable(opponent);
	opponent.body.collideWorldBounds = true;
	opponent.shielded = false
})

// init: grab all other players' info
socket.on('get other players', function(data) {
	Players = data

	
})

// any player moves
socket.on('movement', function(data) {
	Players[data.id].x = data.x
	Players[data.id].y = data.y
})

// a player disconnects
socket.on('delete player', function(id) {
	delete Players[id]
	Players.counter--
	// kill() his ship
})

socket.on('update bank', function(player) {
	Players[player.id] = player
})