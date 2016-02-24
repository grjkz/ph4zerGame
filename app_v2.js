var express = require('express');
var app = express();
var ejs = require('ejs');

var tunnel = app.listen(3000, function() {
	console.log("listening on 3k");
});
var io = require('socket.io')(tunnel);

app.set('view_engine', 'ejs');
app.use(express.static('assets'));


app.get('/', function(req,res) {
	res.render('index_v2.ejs', {players: 0} );
});

app.get('/game_v2', function(req,res) {
	res.render('game_v2.ejs');
});


////////////////
// GAME STUFF //
////////////////

var Users = {}; // users who are are on the game_v2.ejs page
// needed to create a seperate object for in-game Players; if you send all the Users, all those not past the menu are generated as well
var Players = {}; // users who are active in the game (clicked 'join game')
var bulletCounter = 0; // generate a unique id for each bullet; helps to destroy this bullet on impact
// var shieldCounter = 0;
var coinCounter = 0;

/////////////////////
// SOCKET IO STUFF //
/////////////////////


io.on('connection', function(client) {
	// delete user from Users when disconnecting (refreshing page, etc)
	client.on('disconnect', function() {
		// emit to all other players to remove disconnecting player
		client.broadcast.emit('remove player', client.id);
		console.log('emit to delete player:', client.id)
		delete Users[client.id];
		// remember to delete Player as well else it will send non-existent ships to generate
		delete Players[client.id];
		// console.log(Users);
		console.log(getUserCount(Users), "Users Remain")
	});


	// Add new user to Users
	Users[client.id] = new Player(client.id);
	// console.log(Users)
	console.log(getUserCount(Users), "Users")


	// user enters name and clicks "join game"
	client.on('add alias', function(alias) {
		// add alias to User and push into Players
		Users[client.id].alias = alias.alias;
		Players[client.id] = Users[client.id];
		console.log(alias);
		client.emit('start playState'); // command to menu.js that starts playState
	});


	// new user finished loading playState environment
	client.on('environment loaded', function() {
		if (!Users[client.id]) {
			console.log("ERROR: user id in Users not found");
			return;
		}
		// send player his own id and alias
		// send player the data of all in-game players (includes himself)
		// needed to create a seperate object for in-game players; if you send all the Users, all those not past the menu are generated as well
		client.emit('generate players', {
			id: client.id,
			alias: Players[client.id].alias,
			players: Players
		});
		// send new player info to other players
		if (getUserCount(Players) > 1) {
			client.broadcast.emit('add new challenger', Players[client.id]);
		}
	});


	// respawn player (2 seconds)
	client.on('respawn me', function() {
		// set alive status to true
		Players[client.id].alive = true;
		var data = genCoords();
		data.id = client.id;
		console.log('respawn data:')
		console.log(data)
		// notify everyone to render respawning player
		io.emit('respawn player', data);
	});


	// send player movement data to all other players
	client.on('movement', function(data) {
		// console.log(data)
		client.broadcast.emit('movement', data);
	});


	// send player bullet data to all other players
	client.on('shoot', function(data) {
		io.emit('shots fired', {
			id: data.id,
			facing: data.facing,
			bulletID: bulletCounter
		});
		console.log(bulletCounter, "-th bullet shot")
		bulletCounter++;
	});


	// a player has been hit
	client.on('im hit', function(data) {
		// update player's alive status
		Players[client.id].alive = data.alive;
		// broadcast only; reason: player that send 'im hit' has already resolved hitTaken
		client.broadcast.emit('player hit', data);
	});


	client.on('create coin', function() {
		console.log('generating coin')
		io.emit('spawn coin', genCoin());
	});


	// player picks up a coin
	client.on('coin touched', function(data) {
		Users[client.id].bank += data.value;
		io.emit('update bank', {
			id: client.id,
			coinID: data.coinID,
			bank: Users[client.id].bank
		});
		console.log(client.id, Users[client.id].bank)
	});


	//////////////////
	// POWERUP SHOP //
	//////////////////
	client.on('upgrade', function(type) {
		if (Users[client.id].bank >= 400) {
			Users[client.id].bank -= 400;
			client.emit('upgrade receipt', {
				// string, int
				id: client.id,
				bank: Users[client.id].bank
			});
		}
	});
			
	client.on('shield', function() {
		if (Users[client.id].bank >= 350) {
			Users[client.id].bank -= 350;
			Users[client.id].shielded = true;
			io.emit('shield receipt', {
				// string, int, int
				id: client.id,
				// shieldID: shieldCounter++,
				bank: Users[client.id].bank
			});
			// shieldCounter++;
		}
	});

	client.on('vertical', function() {		
		if (Users[client.id].bank >= 350) {
			Users[client.id].bank -= 350;
			var bulletID = [bulletCounter++, bulletCounter++];
			client.emit('vertical receipt', {
				// string, array, int
				id: client.id,
				bulletID: bulletID,
				bank: Users[client.id].bank
			});
		}
	});
	
	client.on('shotgun', function() {
		if (Users[client.id].bank >= 500) {
			Users[client.id].bank -= 500;
			var bulletID = [bulletCounter++, bulletCounter++, bulletCounter++];
			// string, array, int
			client.emit('shotgun receipt', {
				id: client.id,
				bulletID: bulletID,
				bank: Users[client.id].bank
			});
		}
	});
	
	client.on('omnishot', function() {
		if (Users[client.id].bank >= 800) {
			Users[client.id].bank -= 800;
			var bulletID = [bulletCounter++,bulletCounter++,bulletCounter++,bulletCounter++,bulletCounter++,bulletCounter++,bulletCounter++,bulletCounter++];
			client.emit('receipt', {
				// string, array, int
				id: client.id,
				bulletID: bulletID,
				bank: Users[client.id].bank
			});
		}
	});
	
	client.on('ultimate', function() {
		if (Users[client.id].bank >= 900) {
			Users[client.id].bank -= 900;
			// string, int, int
			client.emit('ultimate receipt', {
				id: client.id,
				bulletID: bulletCounter++,
				bank: Users[client.id].bank
			});
		}
	});



});



///////////////
// FUNCTIONS //
///////////////

// player constructor
function Player(id) {
	var coords = genCoords();
	this.id = id;
	this.alias = "";
	this.bank = 0;
	this.x = coords.x; // create random spawn location
	this.y = coords.y; // floor makes max range exclusive
	this.facing = "right";
	this.ship = randomShip();
	this.shielded = false;
	this.alive = false;
}
// generate random coordinate
function genCoords() {
	return {
		x: Math.floor(Math.random()*1181),
		y: Math.floor(Math.random()*501)
	};
}
// pick a random ship
function randomShip() {
	var x = Math.floor(Math.random()*4);
	if (x == 0)
		return "sship";
	if (x == 1)
		return "bship";
	if (x == 2)
		return "rship";
	if (x == 3)
		return "pship";
}


// generate coins
function genCoin() {
	var name = '';
	var timer = 0;
	var value = 0;
	var randomNum = Math.floor(Math.random()*100);
	if (randomNum < 13) {
		name = "gold_coin";
		timer = Math.floor(Math.random() * 10000)+5000;
		value = 500;
	}
	else if (randomNum < 50) {
		name = "silver_coin";
		timer = Math.floor(Math.random() * 10000)+10000;
		value = 200;
	}
	else {
		name = "copper_coin";
		timer = Math.floor(Math.random() * 10000)+10000;
		value = 50;
	}

	coin = {
		x: Math.floor(Math.random()*(1280-32)), // 32 is the size of the coin
		y: Math.floor(Math.random()*(600-32)),
		type: name,
		value: value,
		coinID: coinCounter,
		expire: timer
	};
	coinCounter++;

	return coin;
}


/**
 * Get count of Users or Players
 * @param  {object} clients Users{} or Players{}
 * @return {[type]}         [description]
 */
function getUserCount(clients) {
	var count = 0;
	for (var client in clients) {
		count++;
	}
	return count;
}







