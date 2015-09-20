console.log('game.js linked')
var socket = io();

var game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area', {preload:preload,create:create,update:update})

var bank = 0;
var bankOutput;
var lives = 4;
var bullets;
var myID = 'dont have one yet'
var Players = { counter: 0 }
var playerReady = false

var Bullets = {}
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
	// console.log("Loading sship: "+game.time.time)
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

	// this prevents spacebar from being used in the input tag
  this.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  // changeKey.onDown.add(this.nextWeapon, this);
  ///////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////// POWERUPS
  
  
  ///////////////////////////////////////////////////////////////////


  // tell server that i'm done loading init stuff
  socket.emit('ready')
}

// gets own id and info
socket.on('player info', function(data) {
	// gold_coins.create(0,0,'gold_coin')
	// console.log("first socket: "+game.time.time)
	myID = data.id
	// console.log(data)
	spawnPlayer(data)
	// console.log('my user info was received')
	Players[myID].me = true
})

function spawnPlayer(user) {
	Players.counter++
	Players[user.id] = game.add.sprite(user.x, user.y, 'sship');

	var player = Players[user.id]
	// player.weapons = []
	player.animations.add('right',[0],1,true);
	player.animations.add('down',[1],1,true);
	player.animations.add('left',[2],1,true);
	player.animations.add('up',[3],1,true);
	player.animations.play(user.facing)
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
	player.shielded = false
	player.facing = user.facing
	// shield = game.add.sprite(player.position.x-2.5,player.position.y-2.5,'bubble')

	// socket.emit('player info',{x: player.x, y: player.y})
	playerReady = true
}

function update() {
	if (!playerReady) return
		// check of another user is connected before blasting the server
		if (Players.counter > 1) {
			socket.emit('movement', {
				x: Players[myID].body.x,
				y: Players[myID].body.y, 
				facing: Players[myID].facing
			})
		}
		// also send the direction i'm facing along with my location
		// maybe is should put this into the conditionals that move the player
		// emit { player.x, player.x, player.facing = [direction] }

	//////////////////////////////////////////////////// PLAYER CONTROLS
	Players[myID].body.velocity.set(0);
  if (cursors.down.isDown && cursors.up.isDown) {}
  else if (cursors.up.isDown) {
    Players[myID].body.velocity.y = -300;
    Players[myID].facing = "up"
    Players[myID].animations.play('up')
  }
  else if (cursors.down.isDown) {
    Players[myID].body.velocity.y = 300;
    Players[myID].facing = "down"
    Players[myID].animations.play('down')
  }	
  if (cursors.left.isDown && cursors.right.isDown) {}
  else if (cursors.left.isDown) {
  	Players[myID].body.velocity.x = -300;
  	Players[myID].facing = "left"
  	Players[myID].animations.play('left')
  }
  else if (cursors.right.isDown) {
  	Players[myID].body.velocity.x = 300;
  	Players[myID].facing = "right"
  	Players[myID].animations.play('right')
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && shotTimer < game.time.now) {
  	shotTimer = game.time.now + shotCooldown
		// console.log(myID+': shot')
		socket.emit('shoot', {
			id: myID, 
			facing: Players[myID].facing 
		})
	}

}
//////////////////////////////////////////////////////////////////////////////


// new player joins the game
socket.on('add new user', function(newPlayer) {
	spawnPlayer(newPlayer)
})

// init: grab all other players' info
socket.on('get other players', function(users) {
	// display all the players
	for (user in users) {
		if (user !== 'counter') {
			spawnPlayer(users[user])
		}
	}	
})

socket.on('movement', function(data) {
	Players[data.id].x = data.x
	Players[data.id].y = data.y
	Players[data.id].animations.play(data.facing)
})

////////////////////////////////////////////////////////////// SHOOTING
socket.on('shoot',function(data) {
	shoot(data)
})

function shoot(shooter) {
// id: 
// facing: 
// bulletID
	//create a bullet from Player[shooter.id].x.y with correct velocity
	var shooter = Players[shooter.id]

	console.log(shooter.facing)

	// shooter is facing right
	if (shooter.facing === "right") {
		console.log("shot right")
		Bullets[shooter.bulletID] = bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
		var bullet = Bullets[shooter.bulletID] 
		bullet.body.velocity.x = 400
	}
	// shooter is facing down
	else if (shooter.facing === "down") {
		console.log("shot down")
		Bullets[shooter.bulletID] = bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
		var bullet = Bullets[shooter.bulletID] 
		bullet.body.velocity.y = 400
	}
	// shooter is facing left
	else if (shooter.facing === "left") {
		console.log("shot left")
		Bullets[shooter.bulletID] = bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
		var bullet = Bullets[shooter.bulletID] 
		bullet.body.velocity.x = -400
	}
	// shooter is facing up
	else if (shooter.facing === "up") {
		console.log("shot up")
		Bullets[shooter.bulletID] = bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
		var bullet = Bullets[shooter.bulletID] 
		bullet.body.velocity.y = -400
	}


	// 	// player is facing down
	// 	else if (player.frame === 1) {
	// 		var bullet = bullets.create(player.body.center.x-5, player.body.center.y+30, 'basic_bullet_down')
	// 		bullet.body.velocity.y = 400
	// 	}
	// 	// player is facing left
	// 	else if (player.frame === 2) {
	// 		var bullet = bullets.create(player.body.center.x-30-20, player.body.center.y-4, 'basic_bullet_left')
	// 		bullet.body.velocity.x = -400
	// 	}
	// 	// player is facing up
	// 	else if (player.frame === 3) {
	// 		var bullet = bullets.create(player.body.center.x-5, player.body.center.y-30-20, 'basic_bullet_up')
	// 		bullet.body.velocity.y = -400
	// 	}
		
	// }
}







