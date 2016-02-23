/*

Bugs:
shields dont appear on my screen when opponent purchases it
opponent doesn't respawn on my screen but does on his. if we kill each other once each, we never see each other again since Players[id].alive = false forever

find "note:" for things I should add into the code


FYI:
shot cd starts at 800
at 4 upgrades, it drops to 327.68
at 5 upgrades, it goes drops to 262.144
	you can still dodge between bullets at this shot interval


Bugs
Laggy computers get to pick up one coin multiple times
	make it so that the one who picked it up deletes it off their own computer
	send data to server
	server process the value and stuff
	client.broadcast.emit to all other users to delete and update bank of client.id
	client.id has the coin already deleted, so only send him his own bank info only
		or create conditional where myID = coinID or something, ignore

paint usernames above ships

paint banks below ships in tiny font

uses for empty space at bottom right corner
show upgrade level
show shot cooldown
show total shots fired / fired by player in session / fired in one life


 */

var playState = {

	bank: 0,
	coins: null,
	bankOutput: null,
	Bullets: null, // group of all bullets ever created in game
	Shields: null, // group of all shields
	Ultimates: null,
	myID: "",
	alias: "",

	alive: false,
	playerMoved: false, // true == send server my new coordinates & facing
	playerCounter: 0, // greater than 1 == same as above
	Players: {},
	shields: false, // client shield status
	playerReady: false,
	
	shotTimer: 0,
	shotLevel: 0,
	shotCooldown: 800,

	coinTimer: 0,

	create: function() {
		//////////////////////////////////// RENDER BACKGROUND STUFF FIRST
		Game.add.sprite(0, 0, 'sky');
		Game.add.sprite(0, 600, 'bottom_bar');
		///////////////////////// WINDOW SHOPPING
		// display shield
		Game.add.sprite(30, 620, 'bubble');
		Game.add.text(53, 640, 'S', {fontSize:'16px',fill:'white'});
		Game.add.text(10, 690, 'Shield: $350', {fontSize:'16px', fill:'orange'});
		// display shotgun
		Game.add.sprite(155, 620, 'shotgun_icon');
		Game.add.text(140, 690, 'Shotgun: $250', {fontSize:'16px', fill:'orange'});
		Game.add.text(210, 640, 'F', {fontSize:'16px',fill:'white'});
		// display gun upgrade
		Game.add.sprite(310, 615, 'upgrade_icon');
		Game.add.text(290, 690, 'Upgrade: $500', {fontSize:'16px', fill:'orange'});
		Game.add.text(340, 655, 'Q', {fontSize:'16px',fill:'white'});
		// display veritcal
		Game.add.sprite(450, 620, 'vertical_icon');
		Game.add.text(435, 690, 'Vertical: $200', {fontSize:'16px', fill:'orange'});
		Game.add.text(480, 640, 'E', {fontSize:'16px', fill:'white'});
		// display Omni
		Game.add.sprite(600, 620, 'omni_icon');
		Game.add.text(575, 690, 'Omnishot: $500', {fontSize:'16px', fill:'orange'});
		Game.add.text(630, 640, 'A', {fontSize:'16px', fill:'white'});
		// display Ultimate
		Game.add.sprite(770, 625, 'ult_icon');
		Game.add.text(730, 690, '^^^^^^^^: $3000', {fontSize:'16px', fill:'orange'});
		Game.add.text(750, 640,'R',{fontSize:'16px', fill:'white'});
		//////////////////////////////////////////////////////////////////

		//////////////////////////////////////////////////// GAME OPTIONS
		Game.world.setBounds(0, 0, 1280, 600);
		Game.physics.startSystem(Phaser.Physics.ARCADE);
		Game.renderer.renderSession.roundPixels = true;
		this.bankOutput = Game.add.text(550, 600, 'Bank: 0',{fontSize: '16px', fill: '#83FF59'});
		/////////////////////////////////////////////////////////////////

		/////////////////////////////////////////////// WORLD ITEM OPTIONS
		this.coins = Game.add.group();
		this.coins.enableBody = true;
		//////////////////////////////////////////////////////////////////

		//////////////////////////////////////////////////// BULLET OPTIONS
		this.Bullets = Game.add.group();
		this.Bullets.enableBody = true;
		Game.physics.arcade.enable(this.Bullets);
		this.Ultimates = Game.add.group();
		this.Ultimates.enableBody = true;
		Game.physics.arcade.enable(this.Ultimates);
		///////////////////////////////////////////////////////////////////

		///////////////////////////////////////////// ENABLE PLAYER CONTROLS
		cursors = this.input.keyboard.createCursorKeys();

		// this prevents spacebar from being used in the input tag
	  // Game.onFocus.add(function() {
		Game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	  // }, this)
	  // Game.onBlur.add(function() {
	  // 	// Game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
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
	  this.Shields = Game.add.group();
	  ///////////////////////////////////////////////////////////////////
	  // laser = Game.add.sprite(0,0,'laser')
	  // laser.animations.add('bwaa')

	  // tell server that i'm done loading init stuff
	  // send me all player data
	  socket.emit('environment loaded');

	  /////////////////////////////////////////////////////// PLAYER SPAWNING

		// init: grab all players' info
		socket.on('generate players', function(data) {
			// initialize coin timer to prevent coin spawns while in menu
			this.coinTimer = Game.time.now + 4000;

			this.myID = data.id;
			this.alias = data.alias;
			this.alive = true;
			// render all players
			var players = data.players;
			for (var player in players) {
				this.spawnPlayer(players[player]);
			}
			// players' data and ship has been initialized and rendered
			this.playerReady = true; // enables update() function
		}.bind(this));


		// respawn a dead player
		socket.on('respawn player', function(data) {
			var player = this.Players[data.id];
			// reset() the player first: it sets x/y to zero
			player.reset();
			player.x = data.x;
			player.y = data.y;
			player.alive = true;
			// set player status to alive if self, to enable controls
			if (data.id == this.myID) {
				this.alive = true;
			}
		}.bind(this));


		// new player joins the Game
		socket.on('add new challenger', function(newPlayer) {
			this.spawnPlayer(newPlayer);
		}.bind(this));


		// delete player from game on disconnect
		socket.on('remove player', function(id) {
			this.Players[id].destroy();
			delete this.Players[id];
		}.bind(this));


		// update player positions
		socket.on('movement', function(data) {
			this.Players[data.id].x = data.x;
			this.Players[data.id].y = data.y;
			this.Players[data.id].facing = data.facing;
			this.Players[data.id].animations.play(data.facing);
		}.bind(this));


		// a player has shot (includes me)
		socket.on('shots fired',function(data) {
			this.shoot(data);
		}.bind(this));


		// other player was hit // not this player
		socket.on('player hit', function(data) {
			var player = this.Players[data.id];
			// destroy shield or player
			this.hitTaken(player, data.id);
			// destroy bullet
			this.destroyBullet(data.bulletID);
		}.bind(this));


		socket.on('spawn coin', function(data) {
			this.generateCoin(data);
		}.bind(this));

		// someone picked up a coin; update their bank info and destroy that coin
		socket.on('update bank', function(data) {
			var coins = this.coins.children;
			for (var i = 0; i < coins.length; i++) {
				if (coins[i].coinID == data.coinID) {
					coins[i].destroy();
					break;
				}
			}
			this.updateBank(data.id, data.bank);
		}.bind(this));


																																				///////////////////////
////////////////////////////////////////////////////////////////////////// PURCHASE RECEIPTS //
																																				///////////////////////

		socket.on('upgrade receipt', function(data) {
			this.updateBank(data.id, data.bank);
			if (data.id === this.myID) {
				this.shotLevel++;
				this.shotCooldown *= 0.8;
			}
		}.bind(this));


		socket.on('shield receipt', function(data) {
			this.updateBank(data.id, data.bank);
			var player = this.Players[data.id];
			// create shield at owner's location
			var shield = this.Shields.create(player.x, player.y, 'bubble');
			// give shield the owner's ID
			shield.playerID = data.id;
			// need this for 'player hit' conditionals
			player.shielded = true;
		}.bind(this));
		
	// socket.on('shotgun receipt', function(data) {
	// 	if (data.passed) {
	// 		this.updateBank(data.id, data.bank)
	// 		var shooter = this.Players[data.id]
	// 		// shooter is facing right
	// 		if (this.shooter.facing === "right") {
	// 			var centerShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
	// 				centerShot.body.velocity.x = 400
	// 				centerShot.bulletID = data.bulletID1
	// 			var leftShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
	// 				leftShot.body.velocity.x = 400
	// 				leftShot.body.velocity.y = -200
	// 				leftShot.bulletID = data.bulletID2
	// 			var rightShot = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
	// 				rightShot.body.velocity.x = 400
	// 				rightShot.body.velocity.y = 200
	// 				rightShot.bulletID = data.bulletID3
	// 		}
	// 		// shooter is facing down
	// 		else if (this.shooter.facing === "down") {
	// 			var centerShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
	// 				centerShot.body.velocity.y = 400
	// 				centerShot.bulletID = data.bulletID1
	// 			var leftShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
	// 				leftShot.body.velocity.y = 400
	// 				leftShot.body.velocity.x = 200
	// 				leftShot.bulletID = data.bulletID2
	// 			var rightShot = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
	// 				rightShot.body.velocity.y = 400
	// 				rightShot.body.velocity.x = -200
	// 				rightShot.bulletID = data.bulletID3
	// 		}
	// 		// shooter is facing left
	// 		else if (this.shooter.facing === "left") {
	// 			var centerShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
	// 				centerShot.body.velocity.x = -400
	// 				centerShot.bulletID = data.bulletID1
	// 			var leftShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
	// 				leftShot.body.velocity.x = -400
	// 				leftShot.body.velocity.y = 200
	// 				leftShot.bulletID = data.bulletID2
	// 			var rightShot = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
	// 				rightShot.body.velocity.x = -400
	// 				rightShot.body.velocity.y = -200
	// 				rightShot.bulletID = data.bulletID3
	// 		}
	// 		// shooter is facing up
	// 		else if (this.shooter.facing === "up") {
	// 			var centerShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
	// 				centerShot.body.velocity.y = -400
	// 				centerShot.bulletID = data.bulletID1
	// 			var leftShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
	// 				leftShot.body.velocity.y = -400
	// 				leftShot.body.velocity.x = -200
	// 				leftShot.bulletID = data.bulletID2
	// 			var rightShot = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
	// 				rightShot.body.velocity.y = -400
	// 				rightShot.body.velocity.x = 200
	// 				rightShot.bulletID = data.bulletID3
	// 		}
	// 	}
	// 	this.setOOB()
	// }.bind(this))


	// socket.on('omnishot receipt', function(data){
	// 	if (data.passed) {
	// 		this.updateBank(data.id, data.bank);
	// 		var shooter = Players[data.id]
	// 		// shoot down
	// 		var bullet = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
	// 		bullet.body.velocity.y = 400
	// 		bullet.bulletID = data.bulletID[0]
	// 		// shoot up
	// 		var bullet = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
	// 		bullet.body.velocity.y = -400
	// 		bullet.bulletID = data.bulletID[1]
	// 		// shoot left	
	// 		var bullet = this.Bullets.create(shooter.x+25-30-20, shooter.y+25-4, 'basic_bullet_left')
	// 		bullet.body.velocity.x = -400
	// 		bullet.bulletID = data.bulletID[2]
	// 		// shoot right
	// 		var bullet = this.Bullets.create(shooter.x+25+30, shooter.y+25-4, 'basic_bullet_right')
	// 		bullet.body.velocity.x = 400
	// 		bullet.bulletID = data.bulletID[3]
	// 		// up left
	// 		var bullet = this.Bullets.create(shooter.x-5-20, shooter.y-4, 'basic_bullet_left')
	// 		bullet.body.velocity.y = -300
	// 		bullet.body.velocity.x = -300
	// 		bullet.bulletID = data.bulletID[4]
	// 		// up right
	// 		var bullet = this.Bullets.create(shooter.x+50+5, shooter.y-4, 'basic_bullet_right')
	// 		bullet.body.velocity.y = -300
	// 		bullet.body.velocity.x = 300
	// 		bullet.bulletID = data.bulletID[5]
	// 		// down left
	// 		var bullet = this.Bullets.create(shooter.x-5-20, shooter.y+50+5, 'basic_bullet_left')
	// 		bullet.body.velocity.y = 300
	// 		bullet.body.velocity.x = -300
	// 		bullet.bulletID = data.bulletID[6]
	// 		//down right
	// 		var bullet = this.Bullets.create(shooter.x+50+5, shooter.y+50+5, 'basic_bullet_right')
	// 		bullet.body.velocity.y = 300
	// 		bullet.body.velocity.x = 300
	// 		bullet.bulletID = data.bulletID[7]
	// 	}
	// 	setOOB();
	// }.bind(this))



	// 	socket.on('vertical receipt', function(data) {
	// 	if (data.passed) {
	// 		this.updateBank(data.id, data.bank)
	// 		var shooter = Players[data.id]
	// 		// shoot down
	// 		var bullet = this.Bullets.create(shooter.x+25-5, shooter.y+25+30, 'basic_bullet_down')
	// 		bullet.body.velocity.y = 400
	// 		bullet.bulletID = data.bulletID1
	// 		// shoot up
	// 		var bullet = this.Bullets.create(shooter.x+25-5, shooter.y+25-30-20, 'basic_bullet_up')
	// 		bullet.body.velocity.y = -400
	// 		bullet.bulletID = data.bulletID2
	// 	}
	// 	setOOB()
	// }.bind(this))



	// socket.on('ultimate receipt', function(data) {
	// 	if (data.passed) {
	// 		this.updateBank(data.id, data.bank)
	// 		var shooter = Players[data.id]
	// 		shooter.charging = true // stops the player from moving
	// 		// play charging animation
	// 		var aura = Game.add.sprite(shooter.x-18,shooter.y-9,'charging')
	// 		aura.animations.add('charge')
	// 		aura.animations.play('charge',50,false)

	// 		// needed these 2 to destroy later on 
	// 		var ultimate_origin;
	// 		var bulletMaker;

	// 		// countdown before firing shot
	// 		setTimeout(function() { 
	// 			aura.destroy()
	// 			if (shooter.facing === "right") {
	// 				ultimate_origin = Ultimates.create(shooter.x+30+30, shooter.y-60, 'ult_origin_right')
	// 				ultimate_origin.z = 9999;
	// 				bulletMaker = setInterval(function() {
	// 					var ultimate_body = Ultimates.create(shooter.x+30+120, shooter.y-60+18.5, 'ult_body_vertical')
	// 					ultimate_body.body.velocity.x = 1200
	// 				}, 10)
	// 			}
	// 			// shooter is facing left
	// 			else if (shooter.facing === "left") {
	// 				ultimate_origin = Ultimates.create(shooter.x-15-124, shooter.y-60, 'ult_origin_left')
	// 				ultimate_origin.z = 9999;
	// 				bulletMaker = setInterval(function() {
	// 					var ultimate_body = Ultimates.create(shooter.x-5-120, shooter.y-60+18.5, 'ult_body_vertical')
	// 					ultimate_body.body.velocity.x = -1200
	// 				}, 10)
	// 			}
	// 			// shooter is facing down
	// 			else if (shooter.facing === "down") {
	// 				ultimate_origin = Ultimates.create(shooter.x-59, shooter.y+60, 'ult_origin_down')
	// 				ultimate_origin.z = 9999;
	// 				bulletMaker = setInterval(function() {
	// 					var ultimate_body = Ultimates.create(shooter.x-59+18.5, shooter.y+5+120, 'ult_body_horizontal')
	// 					ultimate_body.body.velocity.y = 1200
	// 				}, 10)
	// 			}
	// 			// shooter is facing up
	// 			else if (shooter.facing === "up") {
	// 				ultimate_origin = Ultimates.create(shooter.x-59, shooter.y-135, 'ult_origin_up')
	// 				ultimate_origin.z = 9999;
	// 				bulletMaker = setInterval(function() {
	// 					var ultimate_body = Ultimates.create(shooter.x-59+18.5, shooter.y-120, 'ult_body_horizontal')
	// 					ultimate_body.body.velocity.y = -1200
	// 				}, 10)
	// 			}
	// 		}, 500)
	// 		// called when done shooting so player can move
	// 		setTimeout(function() { 
	// 			ultimate_origin.destroy()
	// 			clearInterval(bulletMaker)
	// 			shooter.charging = false;
	// 		}, 1000)
	// 		//	destroy the ultimate's bullets
	// 		setTimeout(function() {
	// 			Ultimates.children.forEach(function(thing) {
	// 				thing.destroy()
	// 			})
	// 		}, 2000)
	// 	}
	// }.bind(this))



	},

	spawnPlayer: function(user) {
		// have server send over which ship to render as well
		this.Players[user.id] = Game.add.sprite(user.x, user.y, user.ship);

		var player = this.Players[user.id];
		player.facing = user.facing;
		player.shielded = user.shielded;
		player.charging = false; // note: might have to have this data stored on server in case user connects while player is charging as opposed to respawning
		player.animations.add('right',[0],1,true);
		player.animations.add('down',[1],1,true);
		player.animations.add('left',[2],1,true);
		player.animations.add('up',[3],1,true);
		player.animations.play(user.facing);
		
		Game.physics.arcade.enable(player);
		player.body.collideWorldBounds = true;
		this.updateBank(user.id, user.bank);

		if (player.shielded) {
			var shield = this.Shields.create(player.x, player.y, 'bubble');
			shield.playerID = user.id;
		}
		this.playerCounter++;
	},

	// function(user) {
	// 	this.Players.counter++
	// 	// have server send over which ship to render as well
	// 	this.Players[user.id] = Game.add.sprite(user.x, user.y, user.ship);

	// 	var player = this.Players[user.id]
	// 	// player.weapons = []
	// 	player.animations.add('right',[0],1,true);
	// 	player.animations.add('down',[1],1,true);
	// 	player.animations.add('left',[2],1,true);
	// 	player.animations.add('up',[3],1,true);
	// 	player.animations.play(user.facing)
	// 	Game.physics.arcade.enable(player);
	// 	player.body.collideWorldBounds = true;
	// 	player.shielded = false;
	// 	player.facing = user.facing;
	// 	player.charging = false;
	// 	// player.bank = user.bank
	// 	this.updateBank(user.id, user.bank)
	// 	// shield = Game.add.sprite(player.position.x-2.5,player.position.y-2.5,'bubble')

	// }


	///////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////// PHASER UPDATE()
	update: function() {
		if (!this.playerReady || !this.alive) {
			console.log('player not ready, update() stopping');
			return;
		}

		// makes it so that the mouse must be inside the Game window for the client to issue any commands
		// if (Game.input.activePointer.withinGame) {
	 //    Game.input.enabled = true;
	 //    // Game.stage.backgroundColor = "0x999999";
	 //  }
		// else {
	 //    Game.input.enabled = false;
	 //    // Game.stage.backgroundColor = "0x999999";
		// }

		////////////////////////// PLAYER MOVEMENT
		this.Players[this.myID].body.velocity.set(0);
	  if (cursors.down.isDown && cursors.up.isDown) { return; }
	  else if (cursors.up.isDown) {
	  	if (!this.Players[this.myID].charging) {
		    this.Players[this.myID].body.velocity.y = -300;
		  }
	    this.Players[this.myID].facing = "up";
	    this.Players[this.myID].animations.play('up');
	    this.playerMoved = true;
	  }
	  else if (cursors.down.isDown) {
	  	if (!this.Players[this.myID].charging) {
		    this.Players[this.myID].body.velocity.y = 300;
		  }
	    this.Players[this.myID].facing = "down";
	    this.Players[this.myID].animations.play('down');
	    this.playerMoved = true;
	  }	
	  if (cursors.left.isDown && cursors.right.isDown) { return; }
	  else if (cursors.left.isDown) {
	  	if (!this.Players[this.myID].charging) {
		  	this.Players[this.myID].body.velocity.x = -300;
		  }
	  	this.Players[this.myID].facing = "left";
	  	this.Players[this.myID].animations.play('left');
	  	this.playerMoved = true;
	  }
	  else if (cursors.right.isDown) {
	  	if (!this.Players[this.myID].charging) {
		  	this.Players[this.myID].body.velocity.x = 300;
		  }
	  	this.Players[this.myID].facing = "right";
	  	this.Players[this.myID].animations.play('right');
	  	this.playerMoved = true;
	  }
		// check of another user is connected before blasting the server
		// if (this.playerCounter > 1 && this.playerMoved) {
			socket.emit('movement', {
				id: this.myID,
				x: this.Players[this.myID].body.x,
				y: this.Players[this.myID].body.y, 
				facing: this.Players[this.myID].facing
			});
		// }

		// check if i'm alive, check if shot timer is ok, check if pressed spacebar
	  if (Game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.shotTimer < Game.time.now) {
	  	this.shotTimer = Game.time.now + this.shotCooldown;
			socket.emit('shoot', {
				id: this.myID, 
				facing: this.Players[this.myID].facing 
			});
		}

		/////////////////////////////// COLLISIONS
	  Game.physics.arcade.collide(this.Players[this.myID], this.Bullets, this.playerHit, null, this);
	  Game.physics.arcade.overlap(this.Players[this.myID], this.coins, this.getRich, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Players[this.myID], this.obliterate, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.coins, this.obliterate, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Bullets, this.obliterate, null, this);
	  
	  //////////////////////////////// OTHERS
	  // tell server to generate coins
	  if (this.coinTimer < Game.time.now) {
	  	this.coinTimer = Game.time.now + Math.floor(Math.random()*8000+4000);
	  	socket.emit('create coin');
	  }
	  // redraw shields if any exist
	  if (this.Shields.children.length > 0) {
	  	this.redrawShields();
	  }
	},
	//////////////////////////////////////////////////////////////////////////////


	////////////////////////////////////////////////////////////// SHOOTING

	shoot: function(shooter) {
		var player = this.Players[shooter.id];
		var bullet;
		// shooter is facing right
		if (shooter.facing === "right") {
			bullet = this.Bullets.create(player.x+25+30, player.y+25-4, 'basic_bullet_right');
			bullet.body.velocity.x = 400;
		}
		// shooter is facing down
		else if (shooter.facing === "down") {
			bullet = this.Bullets.create(player.x+25-5, player.y+25+30, 'basic_bullet_down');
			bullet.body.velocity.y = 400;
		}
		// shooter is facing left
		else if (shooter.facing === "left") {
			bullet = this.Bullets.create(player.x+25-30-20, player.y+25-4, 'basic_bullet_left');
			bullet.body.velocity.x = -400;
		}
		// shooter is facing up
		else if (shooter.facing === "up") {
			bullet = this.Bullets.create(player.x+25-5, player.y+25-30-20, 'basic_bullet_up');
			bullet.body.velocity.y = -400;
		}
		bullet.bulletID = shooter.bulletID;
		// makes sure that all bullets are killed upon leaving world bounds
		bullet.checkWorldBounds = true;
		bullet.outOfBoundsKill = true;
		this.destroyBullets(); // note: move this as a set interval or something in create so that it's not called every frame
	},
	//////////////////////////////////////////////////////////// PLAYER HIT
	// LOCAL CLIENT WAS HIT
	playerHit: function(player, bullet) {
		// destroy shield or bullet
		var alive = this.hitTaken(player, this.myID);
		// destroy bullet
		this.destroyBullet(bullet.bulletID);
		// send out player's id and bullet's id
		socket.emit('im hit', {
			id: this.myID,
			bulletID: bullet.bulletID,
			alive: alive
		});
	},

	///////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////// MONEY STUFF
	// SERVER-GENERATED RANDOM COIN
	generateCoin: function(data) {
		// x, y, coinID, type
		var coin = this.coins.create(data.x, data.y, data.type);
		coin.value = data.value;
		coin.coinID = data.coinID;
		coin.animations.add('rotate');
		coin.animations.play('rotate',20,true);
		setTimeout(function() {
			coin.destroy();
		}, data.expire);
	},

	// LOCAL CLIENT PICKS UP COIN
	getRich: function(player, coin) {
		// remove coin from my own screen to prevent multiple pickups due to laggy computer
		coin.kill();
		socket.emit('coin touched', {
			id: this.myID,
			coinID: coin.coinID, 
			value: coin.value
		});
	},

	//////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////// SHOPPING FUCTIONS
	//////////////////////////////////////////////// UPGRADE GUN
	upgradeGun: function() {
		if (this.Players[this.myID].bank >= 400 && this.alive && this.shotLevel < 5)
			socket.emit('upgrade');
	},
	//////////////////////////////////////////////////////////// SHIELD
	buyShield: function() {
		if (this.Players[this.myID].bank >= 350 && !this.Players[this.myID].shielded && this.alive)
			socket.emit('shield');
	},
	/////////////////////////////////////////////////////////// VERTICAL SHOT
	buyVertical: function() {
		if (this.Players[this.myID].bank >= 350 && this.alive)
			socket.emit('verical');
	},
	/////////////////////////////////////////////////////////// SHOTGUN SHOT
	buyShotgun: function() {
		if (this.Players[this.myID].bank >= 500 && this.alive)
			socket.emit('shotgun');
	},
	///////////////////////////////////////////////////////////// 8 WAY SHOT!!!
	buyOmnishot: function() {
		if (this.Players[this.myID].bank >= 800 && this.alive)
			socket.emit('omnishot');
	},
	//////////////////////////////////////////////////////////////// Ultimate
	buyUltimate: function() {
		if (this.Players[this.myID].bank >= 900 && this.alive)
			socket.emit('ultimate');
	},
	///////////////////////////////////////////////////// ULTIMATE HITS SOMETHING
	// kill anything that touches the ultimate
	obliterate: function(victim, ultimate) {
		if (this.Players[myID] === victim) {
			var me = victim;
			socket.emit('im hit', {id: this.myID});
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
				var explode = Game.add.sprite(me.body.center.x-50, me.body.center.y-50,'explode1')
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

	// redraw shields so they follow its ship
	redrawShields: function() {
		this.Shields.children.forEach(function(shield) {
			var player = this.Players[shield.playerID];
			shield.position.set(player.x-2.5,player.y-2.5);
		}.bind(this));
	},

	updateBank: function(id, newBank) {
		this.Players[id].bank = newBank;
		if (id == this.myID) {
			this.bankOutput.text = 'Bank: ' + newBank;
		}
		else {
			// note: for other players if you want to display their bank under their ship
		}
	},

	// set out of bounds for bullets
	setOOB: function() {
		this.Bullets.children.forEach(function(bullet) {
			bullet.checkWorldBounds = true;
			bullet.outOfBoundsKill = true;
		});
	},

	// destroy all out of bound bullets (when they're invisible) to free memory
	destroyBullets: function() {
		this.Bullets.children.forEach(function(bullet) {
			if (!bullet.visible) {
				bullet.destroy();
			}
		});
	},

	// destroyShield: function(id) {
	// 	var shields = this.Shields.children;
	// 	for (var s = 0; s < shields.length; i++) {
	// 		if (shields[s] == data.playerID) {
	// 			shields[s].destroy();
	// 			return;
	// 		}
	// 	}
	// },


	/**
	 * Destroys a shield or kills player
	 * @param  {object} player Player that was shot
	 * @param  {string} me     myID
	 * @return {bool}        Is player still alive?
	 */
	hitTaken: function(player, id) {
		if (player.shielded) { // if shielded
			player.shielded = false;
			var shields = this.Shields.children;
			for (var s = 0; s < shields.length; s++) {
				if (shields[s].playerID == id) {
					shields[s].destroy();
					// return true if play is still alive
					return true;
				}
			}
		}
		// else
		// if killed ship is me
		if (id == this.myID) {
			this.alive = false;
			// set timeout for the player to respawn
			setTimeout(function() {
				socket.emit('respawn me');
			}, 2000);
		}
		// destroy the ship
		player.kill();
		this.Players[id].alive = false;
		//  EXPLODE ANIMATION
		var explode = Game.add.sprite(player.x-25, player.body.center.y-25,'explode1');
		explode.animations.add('explode');
		explode.animations.play('explode',10);
		// return false if player exploded (had no shield)
		return false;
	
	},

	// destroys a single bullet that hit a ship
	destroyBullet: function(bulletID) {
		var bullets = this.Bullets.children;
			// destroy bullet
			for (var i = 0; i < bullets.length; i++) {
				if (bullets[i].bulletID == bulletID) {
					bullets[i].destroy();
					return;
				}
			}
	}
	


};

