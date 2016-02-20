var express = require('express');
var app = express();
var ejs = require('ejs');

var tunnel = app.listen(3000,function() {
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
var shieldCounter = 0;
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
		// send player his own data
		// send player the data of all in-game players (includes himself)
		// needed to create a seperate object for in-game players; if you send all the Users, all those not past the menu are generated as well
		client.emit('generate players', {
			id: client.id,
			alias: Players[client.id].alias,
			users: Players
		});
		// send new player info to other players
		if (getUserCount(Players) > 1) {
			client.broadcast.emit('add new challenger', Players[client.id]);
		}
	});


	// respawn player at waiting 2 seconds
	client.on('respawn me', function() {
		var data = genCoords();
		data.id = client.id;
		console.log('respawn data:')
		console.log(data)
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
		io.emit('player hit', data);
	});


	client.on('create coin', function() {
		console.log('generating coin')
		io.emit('spawn coin', genCoin());
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







