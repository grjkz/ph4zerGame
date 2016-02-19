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


/////////////////////
// SOCKET IO STUFF //
/////////////////////

var Users = {};

io.on('connection', function(client) {
	// delete user from Users when disconnecting (refreshing page, etc)
	client.on('disconnect', function() {
		// emit to all other players to remove disconnecting player
		delete Users[client.id];
		console.log(Users);
		console.log(getUserCount(), "Users Remain")
	});

	// Add new player to Users
	Users[client.id] = new Player(client.id);
	console.log(Users)
	console.log(getUserCount(), "Users")

	// user enters name and clicks "join game"
	client.on('add alias', function(alias) {
		Users[client.id].alias = alias.alias;
		console.log(alias);
		client.emit('start playState'); // command to menu.js
	});

	// user finishes loading playState environment
	client.on('environment loaded', function() {
		client.emit('player init', Users[client.id]);


		// send new player info to other players
		client.broadcast.emit('add new challenger', {player: Users[client.id]});
	});




});





///////////////
// FUNCTIONS //
///////////////

// player constructor
function Player(id) {
	this.id = id;
	this.alias = "";
	this.bank = 0;
	this.x = Math.floor(Math.random()*1181); // create random spawn location
	this.y = Math.floor(Math.random()*501); // floor makes max range exclusive
	this.facing = "right";
	this.ship = randomShip();
	this.shielded = false;

}

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
function genCoins() {
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


// get player count
function getUserCount() {
	var count = 0;
	for (var user in Users) {
		count++;
	}
	return count;
}










