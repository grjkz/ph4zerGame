console.log('game.js linked')
var socket = io();

var game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area', {preload:preload,create:create,update:update})

var bank = 0;
var bankOutput;
var lives = 4;
var bullets;
var myInfo;
var Players = {}
var playerReady = false
var player;

var shotTimer = 0
// decreasing shotLevel towards 0 will increase frequency
// var shotLevel = 1
// var shotCooldown = 500 * shotLevel;
var shotCooldown = 500


function preload() {
	game.load.image('sky','images/sky.jpg');
	game.load.image('ship', 'images/ship.gif');
	// game.load.image('ship', 'images/spaceship.png');
	game.load.image('basic_bullet_right','images/basic_bullet_right.png')
	game.load.image('basic_bullet_down','images/basic_bullet_down.png')
	game.load.image('basic_bullet_left','images/basic_bullet_left.png')
	game.load.image('basic_bullet_up','images/basic_bullet_up.png')
	game.load.image('bubble','images/bubble.png')

	// width, height [, # of frames (of sprite img)]
	game.load.spritesheet('gold_coin', 'images/gold_coin.png', 32, 32, 8)
	game.load.spritesheet('copper_coin', 'images/copper_coin.png',35.2,32)
	game.load.spritesheet('silver_coin', 'images/silver_coin_float.png',32,32)
	game.load.spritesheet('explode1', 'images/explode1.png', 100, 100, 9)
	console.log("Loading sship: "+game.time.time)
	game.load.spritesheet('sship','images/sship.png',50,50)
}


function create() {
	//////////////////////////////////// RENDER BACKGROUND STUFF FIRST
	game.add.sprite(0, 0, 'sky');
	//////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////// GAME OPTIONS
	game.world.setBounds(0, 0, 1280, 600);
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.renderer.renderSession.roundPixels = true;
	bankOutput = game.add.text(550, 600, 'Bank: 0',{fontSize: '16px', fill: '#83FF59'})
	/////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////// WORLD ITEM OPTIONS
	/////////////////////////// GOLD COIN
	gold_coins = game.add.group()
	gold_coins.enableBody = true;
	// enable body needs to next to its creation code for some reason

	var gold_coin = gold_coins.create(Math.floor(Math.random()*(1280-32)),Math.floor(Math.random()*(600-32)),'gold_coin')
	gold_coin.value = 500
	gold_coin.animations.add('rotate')
	gold_coin.animations.play('rotate',20,true)
	setTimeout(function() { gold_coin.kill() ; }, Math.floor(Math.random() * 10000)+5000)

	/////////////////////////// SILVER COIN
	silver_coins = game.add.group()
	silver_coins.enableBody = true;
	silver_coin = silver_coins.create(Math.floor(Math.random()*(1280-32)),Math.floor(Math.random()*(600-32)),'silver_coin')
	silver_coin.value = 200
	silver_coin.animations.add('rotate')
	silver_coin.animations.play('rotate',20,true)
	setTimeout(function() { silver_coin.kill() ; }, Math.floor(Math.random() * 10000)+10000)
	/////////////////////////// COPPER COIN
	copper_coins = game.add.group()
	copper_coins.enableBody = true;
	copper_coin = copper_coins.create(Math.floor(Math.random()*(1280-32)),Math.floor(Math.random()*(600-32)),'copper_coin')
	copper_coin.value = 50
	copper_coin.animations.add('rotate')
	copper_coin.animations.play('rotate',20,true)
	setTimeout(function() { copper_coin.kill() ; }, Math.floor(Math.random() * 10000)+10000)
	//////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////// PLAYER OPTIONS
	// spawnPlayer();
	/////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////// BULLET OPTIONS
	bullets = game.add.group()
	bullets.enableBody = true;
	game.physics.arcade.enable(bullets)
	bullets.setAll('anchor.x',0.5)
	bullets.setAll('anchor.y',0.5)
	bullets.setAll('outOfBoundsKill', true)
	bullets.setAll('checkWorldBounds', true)
	bullets.create(300,300,'basic_bullet_right')
	bullets.create(400,100,'basic_bullet_right')
	bullets.create(0,100,'basic_bullet_right')
	// bullets.create(player.position.x+100, player.position.y+34, 'basic_bullet_horizontal')
	// bullets.create(200, 500, 'basic_bullet_horizontal')
	///////////////////////////////////////////////////////////////////

	///////////////////////////////////////////// ENABLE PLAYER CONTROLS
	cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  // changeKey.onDown.add(this.nextWeapon, this);
  ///////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////// POWERUPS
  
  
  ///////////////////////////////////////////////////////////////////

  socket.emit('ready', myInfo)
}

var lastupdate = 0

function update() {
	if (!playerReady) return
		if (Players.counter) {
			debugger
			socket.emit('movement', player.body.position)
		}
		// also send the direction i'm facing along with my location
		// maybe is should put this into the conditionals that move the player
		// emit { player.x, player.x, player.facing = [direction] }

	// if (lastupdate < game.time.now) {
		// console.log(game.time.now)
		// lastupdate = game.time.now + 8
	// }

  // game.debug.body(shield);
  // game.debug.body(player);

	// game.physics.arcade.collide(player, platforms);

	//////////////////////////////////////////////////// PLAYER CONTROLS
	player.body.velocity.set(0);
  if (cursors.down.isDown && cursors.up.isDown) {}
  else if (cursors.up.isDown) {
    player.body.velocity.y = -300;
    player.animations.play('up')
  }
  else if (cursors.down.isDown) {
    player.body.velocity.y = 300;
    player.animations.play('down')
  }	
  if (cursors.left.isDown && cursors.right.isDown) {}
  else if (cursors.left.isDown) {
  	player.body.velocity.x = -300;
  	player.animations.play('left')
  }
  else if (cursors.right.isDown) {
  	player.body.velocity.x = 300;
  	player.animations.play('right')
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
  	shoot();
  	// player.weapons[0].fire(player);
	}
	/////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////// COLLISIONS
  // game.physics.arcade.collide(player, bullets);
  game.physics.arcade.overlap(player, bullets, playerHit, null, this);
  game.physics.arcade.overlap(player, gold_coins, getRich, null, this);
  game.physics.arcade.overlap(player, copper_coins, getRich, null, this);
  game.physics.arcade.overlap(player, silver_coins, getRich, null, this);

  game.physics.arcade.overlap(silver_coins, bullets, playerHit, null, this);
  /////////////////////////////////////////////////////////////////////

  checkShield()
}


/////////////////////////////////////////////////////////// SOCKET STUFF
// any player moves
socket.on('movement', function(data) {
	Players[data.id].x = data.x
	Players[data.id].y = data.y
	// also check the direction the player is facing
	// have conditionals for which animation to render
})

// a player disconnects
socket.on('delete player', function(id) {
	console.log(id+" has disconnected")
	Players[id].kill()
	delete Players[id]
	Players.counter--
})

socket.on('update bank', function(player) {
	Players[player.id].bank = player.bank
})

// a new player joins
socket.on('add new user', function(newPlayer) {
	Players[newPlayer.id] = game.add.sprite(newPlayer.x, newPlayer.y, 'sship');
	Players.counter++

	// opponent.weapons = []
	Players[newPlayer.id].animations.add('right',[0],1,true);
	Players[newPlayer.id].animations.add('down',[1],1,true);
	Players[newPlayer.id].animations.add('left',[2],1,true);
	Players[newPlayer.id].animations.add('up',[3],1,true);
	game.physics.arcade.enable(Players[newPlayer.id]);
	Players[newPlayer.id].body.collideWorldBounds = true;
	Players[newPlayer.id].shielded = false

	// add bubble to newPlayer location
	// make it invisible
	// not sure if making it invisible will actually disable the bubble hitbox though
	console.log(newPlayer)
})

// init: grab all other players' info
socket.on('get other players', function(data) {
	
	// display all the players
	for (id in data) {
		debugger
		if (id !== 'counter') {
			// console.log("data ids: "+id)
			// debugger
			Players[id] = game.add.sprite(data[id].x, data[id].y, 'sship')
		}
	}	
})
///////////////////////////////////////////////////////////////////////////


function spawnPlayer(x,y) {
	// socket.emit('spawnPlayer', {})

	// console.log("spawnPlayer: "+game.time.time)
	// player.x = x;
	// player.y = y;
	player = game.add.sprite(x, y, 'sship');
	// player.weapons = []
	player.animations.add('right',[0],1,true);
	player.animations.add('down',[1],1,true);
	player.animations.add('left',[2],1,true);
	player.animations.add('up',[3],1,true);
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
	player.shielded = false
	shield = game.add.sprite(player.position.x-2.5,player.position.y-2.5,'bubble')

	// socket.emit('player info',{x: player.x, y: player.y})
	playerReady = true
}


///////////////////////////////////////////// PLAYER COLLISION FUNCTION
function playerHit(player, bullet) {
	if (player.shielded) {
		bullet.kill()
		// shield.kill()
		// don't kill the bubble, make it invisible again
		player.shielded = false
	}
	else {
		//  EXPLODE ANIMATION
		explode = game.add.sprite(player.body.center.x-50, player.body.center.y-50,'explode1')
		explode.animations.add('explode')
		explode.animations.play('explode',10)
		//
		player.kill()
		bullet.kill()
	}
}

socket.on('player hit', function(data) {
	if (Player[data.id].shielded) {
		// remove shield
	}
	else {
		var explode = game.add.sprite(data.x-50, data.y-50, 'explode1')
		explode.animations.add('explode')
		explode.animations.play('explode',10)
		Player[data.id].kill()
		// how do i kill that bullet?
	}
})

////////////////////////////////////////////////////////////// SHOOTING
function shoot() {
	if (shotTimer < game.time.now) {

		// need direction of ship
		// calculate the correct velocity using direction
		// 

		socket.emit('shoot', "Player has fired a shot")
		shotTimer = game.time.now + shotCooldown

		// player is facing right
		if (player.frame === 0) {
			var bullet = bullets.create(player.body.center.x+30, player.body.center.y-4, 'basic_bullet_right')
			bullet.body.velocity.x = 400
			// debugger
		}
		// player is facing down
		else if (player.frame === 1) {
			var bullet = bullets.create(player.body.center.x-5, player.body.center.y+30, 'basic_bullet_down')
			bullet.body.velocity.y = 400
		}
		// player is facing left
		else if (player.frame === 2) {
			var bullet = bullets.create(player.body.center.x-30-20, player.body.center.y-4, 'basic_bullet_left')
			bullet.body.velocity.x = -400
		}
		// player is facing up
		else if (player.frame === 3) {
			var bullet = bullets.create(player.body.center.x-5, player.body.center.y-30-20, 'basic_bullet_up')
			bullet.body.velocity.y = -400
		}
		
	}
}

////////////////////////////////////////////////////// COLLECTING MONIES
function getRich(player, coin) {
	// check the value of the coin
	// add value of coin to total bank

	// try to make the shield follow u from the start
	coin.kill()
	bank += coin.value
	bankOutput.text = 'Bank: '+bank;
	player.shielded = true

	socket.emit('add coin', coin.value)
	// console.log("add coin")
}

function purchaseItem(item) {
	// compare bank with item.cost
	// if pass then... 
		// remove .cost from bank
		// enable/disable buttons
		// enable item ability
}

function upgradeShot() {
	shotCooldown = shotCooldown * 0.9
}

function checkShield() {
	for (player in Players) {
		if (player.shielded === true) {
			// make shielf visible
			// shield.position.set(player.position.x-2.5,player.position.y-2.5)		
		}
	}
}

// gets own id and info
socket.on('player info', function(data) {
	// gold_coins.create(0,0,'gold_coin')
	// console.log("first socket: "+game.time.time)
	myInfo = data
	// console.log(data)
	spawnPlayer(data.x, data.y)
	// console.log('my user info was received')
})



// // any player moves
// socket.on('movement', function(data) {
// 	debugger
// 	Players[data.id].x = data.x
// 	Players[data.id].y = data.y
// })

// // a player disconnects
// socket.on('delete player', function(id) {
// 	delete Players[id]
// 	Players.counter--
// 	// kill() his ship
// })

// socket.on('update bank', function(player) {
// 	Players[player.id] = player
// })