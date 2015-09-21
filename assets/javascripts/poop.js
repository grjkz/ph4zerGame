console.log('game.js linked')
var socket = io();

var game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area', {preload:preload,create:create,update:update})

var bank = 0;
var coins;
var bankOutput;
var lives = 4;
var Bullets;
var myID = 'dont have one yet'
// var Alive = false
var Players = { counter: 0 }
var Shields;
var shields = false;
var playerReady = false
// decreasing shotLevel towards 0 will increase frequency
var shotTimer = 0
var shotLevel = 1
var shotCooldown = 700


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
	coins = game.add.group()
	coins.enableBody = true;
	//////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////// BULLET OPTIONS
	Bullets = game.add.group()
	Bullets.enableBody = true;
	game.physics.arcade.enable(Bullets)
	///////////////////////////////////////////////////////////////////

	///////////////////////////////////////////// ENABLE PLAYER CONTROLS
	cursors = this.input.keyboard.createCursorKeys();

	// this prevents spacebar from being used in the input tag
  // game.onFocus.add(function() {
  // 	console.log('focused')
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // }, this)
  // game.onBlur.add(function() {
  // 	console.log('blurred')
  // 	// game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // }, this)

  // var upgradeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  var upgradeKey = this.input.keyboard.addKey(Phaser.Keyboard.A);
  upgradeKey.onDown.add(upgradeGun, this);
  var shieldKey = this.input.keyboard.addKey(Phaser.Keyboard.W);
  shieldKey.onDown.add(buyShield, this);
  var shotgunKey = this.input.keyboard.addKey(Phaser.Keyboard.F);
  shotgunKey.onDown.add(buyShotgun, this);
  var verticalKey = this.input.keyboard.addKey(Phaser.Keyboard.E);
  verticalKey.onDown.add(buyVertical, this);
  var omniKey = this.input.keyboard.addKey(Phaser.Keyboard.Q);
  omniKey.onDown.add(buyOmnishot, this);
  ///////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////// POWERUPS
  Shields = game.add.group()
  ///////////////////////////////////////////////////////////////////


  // tell server that i'm done loading init stuff
  socket.emit('ready')
}

// gets own id and info
socket.on('player info', function(data) {
	myID = data.id
	if (!data.observer) {
		spawnPlayer(data)
		Players[myID].alive = true
	}
	else {
		Players[myID].alive = false	
	}
})

function spawnPlayer(user) {
	Players.counter++
	// have server send over which ship to render as well
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
	// player.bank = user.bank
	updateBank(user.id, user.bank)
	// shield = game.add.sprite(player.position.x-2.5,player.position.y-2.5,'bubble')

	playerReady = true
}

function update() {
	if (!playerReady) return

	// makes it so that the mouse must be inside the game window for the client to issue any commands
	// if (game.input.activePointer.withinGame) {
 //    game.input.enabled = true;
 //    // game.stage.backgroundColor = "0x999999";
 //  }
	// else {
 //    game.input.enabled = false;
 //    // game.stage.backgroundColor = "0x999999";
	// }

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
	// check of another user is connected before blasting the server
	if (Players.counter > 1) {
		socket.emit('movement', {
			x: Players[myID].body.x,
			y: Players[myID].body.y, 
			facing: Players[myID].facing
		})
	}

	// check if i'm alive, check if shot timer is ok, check if pressed spacebar
  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && Players[myID].alive === true && shotTimer < game.time.now) {
  	shotTimer = game.time.now + shotCooldown;
		socket.emit('shoot', {
			id: myID, 
			facing: Players[myID].facing 
		})
	}


	////////////////////////////////////////////////////////// COLLISIONS
  game.physics.arcade.collide(Players[myID], Bullets, playerHit, null, this);
  game.physics.arcade.overlap(Players[myID], coins, getRich, null, this);
  // game.physics.arcade.overlap(player, copper_coins, getRich, null, this);
  // game.physics.arcade.overlap(player, silver_coins, getRich, null, this);

  // game.physics.arcade.overlap(silver_coins, bullets, playerHit, null, this);
  /////////////////////////////////////////////////////////////////////
  if (shields) {
	  checkShield()
  }
}
//////////////////////////////////////////////////////////////////////////////


// new player joins the game
socket.on('add new user', function(newPlayer) {
	if (!newPlayer.observer) {
		spawnPlayer(newPlayer)
	}
})

// init: grab all other players' info
socket.on('get other players', function(users) {
	// display all the players
	for (user in users) {
		if (user !== 'counter') {
			// if (!user.observer)
				spawnPlayer(users[user])
		}
	}	
})

socket.on('movement', function(data) {
	Players[data.id].x = data.x
	Players[data.id].y = data.y
	Players[data.id].facing = data.facing
	Players[data.id].animations.play(data.facing)
})

////////////////////////////////////////////////////////////// SHOOTING
socket.on('shoots fired',function(data) {
	shoot(data)
})

function shoot(shooter) {

	var player = Players[shooter.id]

	// shooter is facing right
	if (shooter.facing === "right") {
		var bullet = Bullets.create(player.x+25+30, player.y+25-4, 'basic_bullet_right')
		bullet.body.velocity.x = 400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing down
	else if (shooter.facing === "down") {
		var bullet = Bullets.create(player.x+25-5, player.y+25+30, 'basic_bullet_down')
		bullet.body.velocity.y = 400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing left
	else if (shooter.facing === "left") {
		var bullet = Bullets.create(player.x+25-30-20, player.y+25-4, 'basic_bullet_left')
		bullet.body.velocity.x = -400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing up
	else if (shooter.facing === "up") {
		var bullet = Bullets.create(player.x+25-5, player.y+25-30-20, 'basic_bullet_up')
		bullet.body.velocity.y = -400
		bullet.bulletID = shooter.bulletID
	}
	// makes sure that all bullets are killed upon leaving world bounds
	bullet.checkWorldBounds = true
	bullet.outOfBoundsKill = true
	Bullets.children.forEach(function(bullet) {
		if (!bullet.visible) {
			bullet.destroy()
		}
	})
}

// SERVER-GENERATED RANDOM COIN
socket.on('spawn coin', function(data) {
	generateCoin(data)
})

function generateCoin(data) {
	// x, y, coinID, type
	var coin = coins.create(data.x, data.y, data.type)
	coin.value = data.value
	coin.coinID = data.coinID
	coin.animations.add('rotate')
	coin.animations.play('rotate',20,true)
	setTimeout(function() { 
		// coin.kill(); 
		coin.destroy();
	}, data.expire)
}

// LOCAL CLIENT PICKS UP COIN
function getRich(player, coin) {
	// only send the information over so that only one person is picking up the coin to avoid conflict
	socket.emit('coin get', {
		id: myID, 
		coinID: coin.coinID, 
		value: coin.value
	})
}

socket.on('update bank', function(data) {
	coins.children.forEach(function(coin) {
		if (coin.coinID === data.coinID) { coin.kill() }
	})
	updateBank(data.id, data.bank)
})


// LOCAL CLIENT WAS HIT
function playerHit(player, bullet) {
	// send out player's id and bullet's id
	socket.emit('im hit', {id: myID, bulletID: bullet.bulletID})

	var me = Players[myID];

	if (me.shielded === true) {
		Shields.children.forEach(function(shield) {
			if (shield.playerID === myID) {
				shield.destroy();
			}
		})
		bullet.kill()
		me.shielded = false
	}
	else {
		me.kill()
		bullet.kill()
		//  EXPLODE ANIMATION
		var explode = game.add.sprite(me.body.center.x-50, me.body.center.y-50,'explode1')
		explode.animations.add('explode')
		explode.animations.play('explode',10)
		//
	}	
	
}

// remote player was hit
socket.on('player hit', function(data) {
	Bullets.children.forEach(function(bullet) {
		if (bullet.bulletID === data.bulletID)
			bullet.kill()
	})

	var player = Players[data.id];
	if (player.shielded === true) {
		Shields.children.forEach(function(shield) {
			if (shield.playerID === data.id) {
				shield.destroy();
			}
		})
		player.shielded = false
	}
	else {
		player.kill()
		
		//  EXPLODE ANIMATION
		var explode = game.add.sprite(player.x-25, player.body.center.y-25,'explode1')
		explode.animations.add('explode')
		explode.animations.play('explode',10)
		//
		// set interval player.reset(location)
	}
})

/////////////////////////////////////////////////////////// SHOPPING FUCTIONS
///////////////////////////////////// UPGRADE GUN
function upgradeGun() {
	console.log('upgrade gun requested')
	socket.emit('upgrade gun', {})
}
socket.on('upgrade receipt', function(data) {
	if (data.passed) {
		updateBank(data.id, data.bank)
		if (data.id === myID)
			shotCooldown *= 0.8
	}
})
///////////////////////////////////// SHIELD
function buyShield() {
	if (!Players[myID].shielded) {
		socket.emit('buy shield', {})
	}
}
socket.on('shield receipt', function(data) {
	if (data.passed) {
		var player = Players[data.id]
		var shield = Shields.create(player.x, player.y, 'bubble')
		shield.playerID = data.id
		console.log('shield purchase successful')
		updateBank(data.id, data.bank)
		player.shielded = true
		shields = true
	}
})
////////////////////////////////////// SHOTGUN SHOT
function buyShotgun() {
	socket.emit('buy shotgun', {})
}
socket.on('shotgun receipt', function(data) {
	if (data.passed) {
		console.log('shooting shotgun')
		updateBank(data.id, data.bank)
		var shooter = Players[data.id]
		// shooter is facing right
		if (shooter.facing === "right") {
			var centerShot = Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				centerShot.body.velocity.x = 400
				centerShot.bulletID = data.bulletID1
			var leftShot = Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				leftShot.body.velocity.x = 400
				leftShot.body.velocity.y = -200
				leftShot.bulletID = data.bulletID2
			var rightShot = Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				rightShot.body.velocity.x = 400
				rightShot.body.velocity.y = 200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing down
		else if (shooter.facing === "down") {
			var centerShot = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				centerShot.body.velocity.y = 400
				centerShot.bulletID = data.bulletID1
			var leftShot = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				leftShot.body.velocity.y = 400
				leftShot.body.velocity.x = 200
				leftShot.bulletID = data.bulletID2
			var rightShot = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				rightShot.body.velocity.y = 400
				rightShot.body.velocity.x = -200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing left
		else if (shooter.facing === "left") {
			var centerShot = Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				centerShot.body.velocity.x = -400
				centerShot.bulletID = data.bulletID1
			var leftShot = Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				leftShot.body.velocity.x = -400
				leftShot.body.velocity.y = 200
				leftShot.bulletID = data.bulletID2
			var rightShot = Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				rightShot.body.velocity.x = -400
				rightShot.body.velocity.y = -200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing up
		else if (shooter.facing === "up") {
			var centerShot = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				centerShot.body.velocity.y = -400
				centerShot.bulletID = data.bulletID1
			var leftShot = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				leftShot.body.velocity.y = -400
				leftShot.body.velocity.x = -200
				leftShot.bulletID = data.bulletID2
			var rightShot = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				rightShot.body.velocity.y = -400
				rightShot.body.velocity.x = 200
				rightShot.bulletID = data.bulletID3
		}
	}
})
////////////////////////////////////// VERTICAL SHOT
function buyVertical() {
	console.log('vertical shot requested')
	socket.emit('buy vertical', {})
}
socket.on('vertical receipt', function(data) {
	if (data.passed) {
		updateBank(data.id, data.bank)
		var shooter = Players[data.id]
		// shoot down
		var bullet = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
		bullet.body.velocity.y = 400
		bullet.bulletID = data.bulletID1
		// shoot up
		var bullet = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
		bullet.body.velocity.y = -400
		bullet.bulletID = data.bulletID2
	}
})
////////////////////////////////////// 8 WAY SHOT!!!
function buyOmnishot() {
	socket.emit('buy omnishot', {})
}
socket.on('omnishot receipt', function(data){
	if (data.passed) {
		updateBank(data.id, data.bank);
		var shooter = Players[data.id]
		// shoot down
		var bullet = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
		bullet.body.velocity.y = 400
		bullet.bulletID = data.bulletID[0]
		// shoot up
		var bullet = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
		bullet.body.velocity.y = -400
		bullet.bulletID = data.bulletID[1]
		// shoot left	
		var bullet = Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
		bullet.body.velocity.x = -400
		bullet.bulletID = data.bulletID[2]
		// shoot right
		var bullet = Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
		bullet.body.velocity.x = 400
		bullet.bulletID = data.bulletID[3]
		// up left
		var bullet = Bullets.create(shooter.x-5-20, shooter.y-4, 'basic_bullet_left')
		bullet.body.velocity.y = -300
		bullet.body.velocity.x = -300
		bullet.bulletID = data.bulletID[4]
		// up right
		var bullet = Bullets.create(shooter.x+50+5, shooter.y-4, 'basic_bullet_right')
		bullet.body.velocity.y = -300
		bullet.body.velocity.x = 300
		bullet.bulletID = data.bulletID[5]
		// down left
		var bullet = Bullets.create(shooter.x-5-20, shooter.y+50+5, 'basic_bullet_left')
		bullet.body.velocity.y = 300
		bullet.body.velocity.x = -300
		bullet.bulletID = data.bulletID[6]
		//down right
		var bullet = Bullets.create(shooter.x+50+5, shooter.y+50+5, 'basic_bullet_right')
		bullet.body.velocity.y = 300
		bullet.body.velocity.x = 300
		bullet.bulletID = data.bulletID[7]
	}
})
/////////////////////////////// HADOUKEN
function buyHadouken() {
	socket.emit('buy hadouken', {})
}
socket.on('hadouken receipt', function(data) {
	if (data.passed) {
		updateBank(data.id, data.bank)
		var shooter = Players[data.id]
		if (shooter.facing === "right") {
			var hadouken = Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
			hadouken.body.velocity.x = 400
			hadouken.bulletID = shooter.bulletID
		}
		// shooter is facing down
		else if (shooter.facing === "down") {
			var hadouken = Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
			hadouken.body.velocity.y = 400
			hadouken.bulletID = shooter.bulletID
		}
		// shooter is facing left
		else if (shooter.facing === "left") {
			var hadouken = Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
			hadouken.body.velocity.x = -400
			hadouken.bulletID = shooter.bulletID
		}
		// shooter is facing up
		else if (shooter.facing === "up") {
			var hadouken = Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
			hadouken.body.velocity.y = -400
			hadouken.bulletID = shooter.bulletID
		}
	}
})
////////////////////////////////////////////////////////////////////////////

// damn update is too fast to let this work
function checkShield() {
	// this blocks the error mentioned above
	if (Shields.children.length < 1) {
		shields = false
		return false
	}
	Shields.children.forEach(function(shield) {
		if (shield.playerID) {
			var player = Players[shield.playerID]
			shield.position.set(player.x-2.5,player.y-2.5)
		}
	})
}

function updateBank(id, amount) {
	Players[id].bank = amount
	bankOutput.text = 'Bank: '+Players[myID].bank;
}















