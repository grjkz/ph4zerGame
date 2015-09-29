var playState = {

	bank: 0,
	coins: null,
	bankOutput: {},
	lives: 4,
	Bullets: null,
	Ultimates: null,
	myID: 'dont have one yet',
	// Alive: false,
	Players: { counter: 0 },
	Shields: null,
	shields: false,
	playerReady: false,
	// decreasing shotLevel towards 0 will increase frequency
	shotTimer: 0,
	shotLevel: 1,
	shotCooldown: 700,

	create: function() {
	//////////////////////////////////// RENDER BACKGROUND STUFF FIRST
	game.add.sprite(0, 0, 'sky');
	game.add.sprite(0, 600, 'bottom_bar')
	///////////////////////// WINDOW SHOPPING
	// display shield
	game.add.sprite(30, 620, 'bubble')
	game.add.text(53, 640, 'S', {fontSize:'16px',fill:'white'})
	game.add.text(10, 690, 'Shield: $350', {fontSize:'16px', fill:'orange'})
	// display shotgun
	game.add.sprite(155, 620, 'shotgun_icon')
	game.add.text(140, 690, 'Shotgun: $250', {fontSize:'16px', fill:'orange'})
	game.add.text(210, 640, 'F', {fontSize:'16px',fill:'white'})
	// display gun upgrade
	game.add.sprite(310, 615, 'upgrade_icon')
	game.add.text(290, 690, 'Upgrade: $500', {fontSize:'16px', fill:'orange'})
	game.add.text(340, 655, 'Q', {fontSize:'16px',fill:'white'})
	// display veritcal
	game.add.sprite(450, 620, 'vertical_icon')
	game.add.text(435, 690, 'Vertical: $200', {fontSize:'16px', fill:'orange'})
	game.add.text(480, 640, 'E', {fontSize:'16px', fill:'white'})
	// display Omni
	game.add.sprite(600, 620, 'omni_icon')
	game.add.text(575, 690, 'Omnishot: $500', {fontSize:'16px', fill:'orange'})
	game.add.text(630, 640, 'A', {fontSize:'16px', fill:'white'})
	// display Ultimate
	game.add.sprite(770, 625, 'ult_icon')
	game.add.text(730, 690, '^^^^^^^^: $3000', {fontSize:'16px', fill:'orange'})
	game.add.text(750, 640,'R',{fontSize:'16px', fill:'white'})
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
	Ultimates = game.add.group();
	Ultimates.enableBody = true;
	game.physics.arcade.enable(Ultimates)
	///////////////////////////////////////////////////////////////////

	///////////////////////////////////////////// ENABLE PLAYER CONTROLS
	cursors = this.input.keyboard.createCursorKeys();

	// this prevents spacebar from being used in the input tag
  // game.onFocus.add(function() {
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // }, this)
  // game.onBlur.add(function() {
  // 	// game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // }, this)

  // var upgradeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  var upgradeKey = this.input.keyboard.addKey(Phaser.Keyboard.Q);
  upgradeKey.onDown.add(this.upgradeGun, this);
  var shieldKey = this.input.keyboard.addKey(Phaser.Keyboard.S);
  shieldKey.onDown.add(this.buyShield, this);
  var shotgunKey = this.input.keyboard.addKey(Phaser.Keyboard.F);
  shotgunKey.onDown.add(this.buyShotgun, this);
  var verticalKey = this.input.keyboard.addKey(Phaser.Keyboard.E);
  verticalKey.onDown.add(this.buyVertical, this);
  var omniKey = this.input.keyboard.addKey(Phaser.Keyboard.A);
  omniKey.onDown.add(this.buyOmnishot, this);
  var ultimateKey = this.input.keyboard.addKey(Phaser.Keyboard.R);
  ultimateKey.onDown.add(this.buyUltimate, this);
  ///////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////// POWERUPS
  Shields = game.add.group()
  ///////////////////////////////////////////////////////////////////
  // laser = game.add.sprite(0,0,'laser')
  // laser.animations.add('bwaa')

  // tell server that i'm done loading init stuff
  socket.emit('ready')

  /////////////////////////////////////////////////////// PLAYER SPAWNING
	// gets own id and info
	socket.on('player info', function(data) {
		myID = data.id
		if (!data.observer) {
			debugger
			this.spawnPlayer(data)
			this.Players[myID].alive = true
		}
		else {
			this.Players[myID].alive = false	
		}
	}.bind(this))

	// new player joins the game
	socket.on('add new user', function(newPlayer) {
		if (!newPlayer.observer) {
			this.spawnPlayer(newPlayer)
		}
	}.bind(this))

	// init: grab all other players' info
	socket.on('get other players', function(users) {
		// display all the players
		for (user in users) {
			if (user !== 'counter') {
				// if (!user.observer)
					this.spawnPlayer(users[user])
			}
		}	
	}.bind(this))

	socket.on('movement', function(data) {
		this.Players[data.id].x = data.x
		this.Players[data.id].y = data.y
		this.Players[data.id].facing = data.facing
		this.Players[data.id].animations.play(data.facing)
	}.bind(this))

	socket.on('shoots fired',function(data) {
		this.shoot(data)
	}.bind(this))

	// remote player was hit
socket.on('player hit', function(data) {
	this.Bullets.children.forEach(function(bullet) {
		if (bullet.bulletID === data.bulletID)
			bullet.destroy()
	}.bind(this))

	var player = this.Players[data.id];
	if (player.shielded === true) {
		this.Shields.children.forEach(function(shield) {
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
socket.on('spawn coin', function(data) {
	this.generateCoin(data)
}.bind(this))

socket.on('update bank', function(data) {
	this.coins.children.forEach(function(coin) {
		if (coin.coinID === data.coinID) { coin.destroy() }
	})
	this.updateBank(data.id, data.bank)
}.bind(this))
socket.on('shotgun receipt', function(data) {
	if (data.passed) {
		this.updateBank(data.id, data.bank)
		var shooter = this.Players[data.id]
		// shooter is facing right
		if (this.shooter.facing === "right") {
			var centerShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				centerShot.body.velocity.x = 400
				centerShot.bulletID = data.bulletID1
			var leftShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				leftShot.body.velocity.x = 400
				leftShot.body.velocity.y = -200
				leftShot.bulletID = data.bulletID2
			var rightShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
				rightShot.body.velocity.x = 400
				rightShot.body.velocity.y = 200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing down
		else if (this.shooter.facing === "down") {
			var centerShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				centerShot.body.velocity.y = 400
				centerShot.bulletID = data.bulletID1
			var leftShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				leftShot.body.velocity.y = 400
				leftShot.body.velocity.x = 200
				leftShot.bulletID = data.bulletID2
			var rightShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
				rightShot.body.velocity.y = 400
				rightShot.body.velocity.x = -200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing left
		else if (this.shooter.facing === "left") {
			var centerShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				centerShot.body.velocity.x = -400
				centerShot.bulletID = data.bulletID1
			var leftShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				leftShot.body.velocity.x = -400
				leftShot.body.velocity.y = 200
				leftShot.bulletID = data.bulletID2
			var rightShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
				rightShot.body.velocity.x = -400
				rightShot.body.velocity.y = -200
				rightShot.bulletID = data.bulletID3
		}
		// shooter is facing up
		else if (this.shooter.facing === "up") {
			var centerShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				centerShot.body.velocity.y = -400
				centerShot.bulletID = data.bulletID1
			var leftShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				leftShot.body.velocity.y = -400
				leftShot.body.velocity.x = -200
				leftShot.bulletID = data.bulletID2
			var rightShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
				rightShot.body.velocity.y = -400
				rightShot.body.velocity.x = 200
				rightShot.bulletID = data.bulletID3
		}
	}
	this.setOOB()
}.bind(this))
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
	setOOB();
})
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
	setOOB()
})

socket.on('upgrade receipt', function(data) {
	if (data.passed) {
		updateBank(data.id, data.bank)
		if (data.id === myID)
			shotCooldown *= 0.8
	}
})
socket.on('shield receipt', function(data) {
	if (data.passed) {
		var player = Players[data.id]
		var shield = Shields.create(player.x, player.y, 'bubble')
		shield.playerID = data.id
		updateBank(data.id, data.bank)
		player.shielded = true
		shields = true
	}
})
socket.on('ultimate receipt', function(data) {
	if (data.passed) {
		updateBank(data.id, data.bank)
		var shooter = Players[data.id]
		shooter.charging = true // stops the player from moving
		// play charging animation
		var aura = game.add.sprite(shooter.x-18,shooter.y-9,'charging')
		aura.animations.add('charge')
		aura.animations.play('charge',50,false)

		// needed these 2 to destroy later on 
		var ultimate_origin;
		var bulletMaker;

		// countdown before firing shot
		setTimeout(function() { 
			aura.destroy()
			if (shooter.facing === "right") {
				ultimate_origin = Ultimates.create(shooter.x+30+30, shooter.y-60, 'ult_origin_right')
				ultimate_origin.z = 9999;
				bulletMaker = setInterval(function() {
					var ultimate_body = Ultimates.create(shooter.x+30+120, shooter.y-60+18.5, 'ult_body_vertical')
					ultimate_body.body.velocity.x = 1200
				}, 10)
			}
			// shooter is facing left
			else if (shooter.facing === "left") {
				ultimate_origin = Ultimates.create(shooter.x-15-124, shooter.y-60, 'ult_origin_left')
				ultimate_origin.z = 9999;
				bulletMaker = setInterval(function() {
					var ultimate_body = Ultimates.create(shooter.x-5-120, shooter.y-60+18.5, 'ult_body_vertical')
					ultimate_body.body.velocity.x = -1200
				}, 10)
			}
			// shooter is facing down
			else if (shooter.facing === "down") {
				ultimate_origin = Ultimates.create(shooter.x-59, shooter.y+60, 'ult_origin_down')
				ultimate_origin.z = 9999;
				bulletMaker = setInterval(function() {
					var ultimate_body = Ultimates.create(shooter.x-59+18.5, shooter.y+5+120, 'ult_body_horizontal')
					ultimate_body.body.velocity.y = 1200
				}, 10)
			}
			// shooter is facing up
			else if (shooter.facing === "up") {
				ultimate_origin = Ultimates.create(shooter.x-59, shooter.y-135, 'ult_origin_up')
				ultimate_origin.z = 9999;
				bulletMaker = setInterval(function() {
					var ultimate_body = Ultimates.create(shooter.x-59+18.5, shooter.y-120, 'ult_body_horizontal')
					ultimate_body.body.velocity.y = -1200
				}, 10)
			}
		}, 500)
		// called when done shooting so player can move
		setTimeout(function() { 
			ultimate_origin.destroy()
			clearInterval(bulletMaker)
			shooter.charging = false;
		}, 1000)
		//	destroy the ultimate's bullets
		setTimeout(function() {
			Ultimates.children.forEach(function(thing) {
				thing.destroy()
			})
		}, 2000)
	}
})



},

spawnPlayer: function(user) {
	this.Players.counter++
	// have server send over which ship to render as well
	this.Players[user.id] = game.add.sprite(user.x, user.y, user.ship);

	var player = this.Players[user.id]
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
	player.charging = false;
	// player.bank = user.bank
	this.updateBank(user.id, user.bank)
	// shield = game.add.sprite(player.position.x-2.5,player.position.y-2.5,'bubble')

	this.playerReady = true
},


///////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////// PHASER UPDATE()
update: function() {
	if (!this.playerReady) return

	// makes it so that the mouse must be inside the game window for the client to issue any commands
	// if (game.input.activePointer.withinGame) {
 //    game.input.enabled = true;
 //    // game.stage.backgroundColor = "0x999999";
 //  }
	// else {
 //    game.input.enabled = false;
 //    // game.stage.backgroundColor = "0x999999";
	// }

	////////////////////////// PLAYER CONTROLS
	this.Players[myID].body.velocity.set(0);
  if (cursors.down.isDown && cursors.up.isDown) {}
  else if (cursors.up.isDown) {
  	if (!this.Players[myID].charging) {
	    this.Players[myID].body.velocity.y = -300;
	  }
    this.Players[myID].facing = "up"
    this.Players[myID].animations.play('up')
  }
  else if (cursors.down.isDown) {
  	if (!this.Players[myID].charging) {
	    this.Players[myID].body.velocity.y = 300;
	  }
    this.Players[myID].facing = "down"
    this.Players[myID].animations.play('down')
  }	
  if (cursors.left.isDown && cursors.right.isDown) {}
  else if (cursors.left.isDown) {
  	if (!this.Players[myID].charging) {
	  	this.Players[myID].body.velocity.x = -300;
	  }
  	this.Players[myID].facing = "left"
  	this.Players[myID].animations.play('left')
  }
  else if (cursors.right.isDown) {
  	if (!this.Players[myID].charging) {
	  	this.Players[myID].body.velocity.x = 300;
	  }
  	this.Players[myID].facing = "right"
  	this.Players[myID].animations.play('right')
  }
	// check of another user is connected before blasting the server
	if (this.Players.counter > 1) {
		socket.emit('movement', {
			x: this.Players[myID].body.x,
			y: this.Players[myID].body.y, 
			facing: this.Players[myID].facing
		})
	}

	// check if i'm alive, check if shot timer is ok, check if pressed spacebar
  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.Players[myID].alive === true && this.shotTimer < game.time.now) {
  	this.shotTimer = game.time.now + this.shotCooldown;
		socket.emit('shoot', {
			id: myID, 
			facing: this.Players[myID].facing 
		})
	}

	/////////////////////////////// COLLISIONS
  game.physics.arcade.collide(this.Players[myID], this.Bullets, this.playerHit, null, this);
  game.physics.arcade.overlap(this.Players[myID], this.coins, this.getRich, null, this);
  game.physics.arcade.overlap(this.Ultimates, this.Players[myID], this.obliterate, null, this);
  game.physics.arcade.overlap(this.Ultimates, this.coins, this.obliterate, null, this);
  game.physics.arcade.overlap(this.Ultimates, this.Bullets, this.obliterate, null, this);
  
  //////////////////////////////// OTHERS
  if (this.shields) {
	  this.checkShield()
  }
},
//////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////// SHOOTING

shoot: function(shooter) {

	var player = this.Players[shooter.id]

	// shooter is facing right
	if (shooter.facing === "right") {
		var bullet = this.Bullets.create(player.x+25+30, player.y+25-4, 'basic_bullet_right')
		bullet.body.velocity.x = 400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing down
	else if (shooter.facing === "down") {
		var bullet = this.Bullets.create(player.x+25-5, player.y+25+30, 'basic_bullet_down')
		bullet.body.velocity.y = 400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing left
	else if (shooter.facing === "left") {
		var bullet = this.Bullets.create(player.x+25-30-20, player.y+25-4, 'basic_bullet_left')
		bullet.body.velocity.x = -400
		bullet.bulletID = shooter.bulletID
	}
	// shooter is facing up
	else if (shooter.facing === "up") {
		var bullet = this.Bullets.create(player.x+25-5, player.y+25-30-20, 'basic_bullet_up')
		bullet.body.velocity.y = -400
		bullet.bulletID = shooter.bulletID
	}
	// makes sure that all bullets are killed upon leaving world bounds
	bullet.checkWorldBounds = true
	bullet.outOfBoundsKill = true
	this.destroyBullets();
},
//////////////////////////////////////////////////////////// PLAYER HIT
// LOCAL CLIENT WAS HIT
playerHit: function(player, bullet) {
	// send out player's id and bullet's id
	socket.emit('im hit', {id: this.myID, bulletID: bullet.bulletID})

	var me = this.Players[myID];

	if (me.shielded === true) {
		this.Shields.children.forEach(function(shield) {
			if (shield.playerID === this.myID) {
				shield.destroy();
			}
		})
		bullet.destroy()
		me.shielded = false
	}
	else {
		me.kill()
		me.alive = false
		// facing unknown might disable any type of shooting
		me.facing = 'unknown'
		bullet.destroy()
		//  EXPLODE ANIMATION
		var explode = game.add.sprite(me.body.center.x-50, me.body.center.y-50,'explode1')
		explode.animations.add('explode')
		explode.animations.play('explode',10)
		//
	}	
	// set timeout for the plaer to respawn
	// set player status to alive
	// decrease number of lives as necessary
	// reset() the player
},

///////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////// MONEY STUFF
// SERVER-GENERATED RANDOM COIN
generateCoin: function(data) {
	// x, y, coinID, type
	var coin = this.coins.create(data.x, data.y, data.type)
	coin.value = data.value
	coin.coinID = data.coinID
	coin.animations.add('rotate')
	coin.animations.play('rotate',20,true)
	setTimeout(function() { 
		// coin.kill(); 
		coin.destroy();
	}, data.expire)
},

// LOCAL CLIENT PICKS UP COIN
getRich: function(player, coin) {
	// only send the information over so that only one person is picking up the coin to avoid conflict
	socket.emit('coin get', {
		id: this.myID, 
		coinID: coin.coinID, 
		value: coin.value
	})
},

//////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////// SHOPPING FUCTIONS
//////////////////////////////////////////////// UPGRADE GUN
upgradeGun: function() {
	socket.emit('upgrade gun', {})
},

//////////////////////////////////////////////////////////// SHIELD
buyShield: function() {
	if (!this.Players[myID].shielded) {
		socket.emit('buy shield', {})
	}
},

/////////////////////////////////////////////////////////// SHOTGUN SHOT
buyShotgun: function() {
	socket.emit('buy shotgun', {})
},


/////////////////////////////////////////////////////////// VERTICAL SHOT
buyVertical: function() {
	socket.emit('buy vertical', {})
},

///////////////////////////////////////////////////////////// 8 WAY SHOT!!!
buyOmnishot: function() {
	socket.emit('buy omnishot', {})
},


//////////////////////////////////////////////////////////////// Ultimate
buyUltimate: function() {
	socket.emit('buy ultimate', {})
},

///////////////////////////////////////////////////// ULTIMATE HITS SOMETHING
// kill anything that touches the ultimate
obliterate: function(victim, ultimate) {
		// debugger
	if (this.Players[myID] === victim) {
		var me = victim;
		socket.emit('im hit', {id: this.myID})
		if (me.shielded === true) {
			this.Shields.children.forEach(function(shield) {
				if (shield.playerID === this.myID) {
					shield.destroy();
				}
			})
			me.shielded = false
		}
		else {
			me.kill()
			me.alive = false
			// facing unknown might disable any type of shooting
			me.facing = 'unknown'
			//  EXPLODE ANIMATION
			var explode = game.add.sprite(me.body.center.x-50, me.body.center.y-50,'explode1')
			explode.animations.add('explode')
			explode.animations.play('explode',10)
			//
		}	
	}
	else {
		ultimate.destroy()
	}
},

////////////////////////////////////////////////////////////////////////////

// damn update is too fast to let this work
checkShield: function() {
	// this blocks the error mentioned above
	if (this.Shields.children.length < 1) {
		this.shields = false
		return false
	}
	this.Shields.children.forEach(function(shield) {
		if (shield.playerID) {
			var player = this.Players[shield.playerID]
			shield.position.set(player.x-2.5,player.y-2.5)
		}
	})
},

updateBank: function(id, amount) {
	this.Players[id].bank = amount
	this.bankOutput.text = 'Bank: '+this.Players[myID].bank;
},

// set out of bounds for bullets
setOOB: function() {
	this.Bullets.children.forEach(function(bullet) {
		bullet.checkWorldBounds = true;
		bullet.outOfBoundsKill = true;
	})
},

// destroy all out of bound bullets
destroyBullets: function() {
	this.Bullets.children.forEach(function(bullet) {
		if (!bullet.visible) {
			bullet.destroy()
		}
	})
}





}