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
shots fired by player in session / fired in one life


 */

var playState = {

	myID: "",
	alias: "",
	alive: false,
	playerMoved: false, // true == send server my new coordinates & facing
	playerReady: false,
	
	bank: 0,
	Coins: null, // group of all coins created in game
	bankOutput: null,
	coinTimer: 0,

	Bullets: null, // group of all bullets ever created in game
	sessionShots: 0, // total number of shots made since joining the game
	sessionShotNum: null,
	lifetimeShots: 0, // number of shots made since last (re)spawn
	lifetimeShotNum: null,
	shotTimer: 0,
	shotLevel: 0,
	shotCooldown: 800,
	bulletVelocity: 400,
	
	Shields: null, // group of all shields
	Ultimates: null,
	ultimateShotNum: 0,
	charging: false, // charging to fire ultimate

	Players: {},
	playerCounter: 0, // greater than 1 == send server movement data

	cursors: null, // for player controls

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
		Game.add.text(735, 690, 'Ka***ha: $3000', {fontSize:'16px', fill:'orange'});
		Game.add.text(750, 640,'R',{fontSize:'16px', fill:'white'});
		//////////////////////////////////////////////////////////////////

		//////////////////////////////////////////////////// GAME OPTIONS
		Game.world.setBounds(0, 0, 1280, 600);
		Game.physics.startSystem(Phaser.Physics.ARCADE);
		Game.renderer.renderSession.roundPixels = true;
		this.bankOutput = Game.add.text(550, 600, 'Bank: 0',{fontSize: '16px', fill: '#83FF59'});
		Game.add.text(1030, 605, "STATS", {fontSize: '14px', fill: 'black', fontStyle: 'italic'});
		// Clean Up Bullets
		var clearbullets = this.destroyBullets.bind(this);
		setInterval(function() {
			clearbullets();
		}, 5000);
		/////////////////////////////////////////////////////////////////

		/////////////////////////////////////////////// WORLD ITEM OPTIONS
		this.Coins = Game.add.group();
		this.Coins.enableBody = true;
		//////////////////////////////////////////////////////////////////

		//////////////////////////////////////////////////// BULLET OPTIONS
		this.Bullets = Game.add.group();
		this.Bullets.enableBody = true;
		Game.physics.arcade.enable(this.Bullets);
		this.Ultimates = Game.add.group();
		this.Ultimates.enableBody = true;
		Game.physics.arcade.enable(this.Ultimates);
		// bullet meta output
		Game.add.text(870, 630, "Total Shots:", {fontSize: '14px', fill: 'white'});
		this.sessionShotNum = Game.add.text(980, 630, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(870, 650, "Lifetime Shots:", {fontSize: '14px', fill: 'white'});
		this.lifetimeShotNum = Game.add.text(980, 650, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(870, 670, "Ultimates:", {fontSize: '14px', fill: 'white'});
		this.ultimateShotNum = Game.add.text(980, 670, "0", {fontSize: '14px', fill: 'orange'});
		///////////////////////////////////////////////////////////////////

		///////////////////////////////////////////// ENABLE PLAYER CONTROLS
		this.cursors = this.input.keyboard.createCursorKeys();

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
	  var verticalKey = this.input.keyboard.addKey(Phaser.Keyboard.E);
	  verticalKey.onDown.add(this.buyVertical, this);
	  var shotgunKey = this.input.keyboard.addKey(Phaser.Keyboard.F);
	  shotgunKey.onDown.add(this.buyShotgun, this);
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

		// Init: grab all players' info
		// Spawn all players
		socket.on('generate players', function(data) {
			// initialize coin timer to prevent coin spawns while in menu
			this.coinTimer = Game.time.now + 4000;

			this.myID = data.id;
			this.alias = data.alias;
			this.alive = true;
			// Render all players
			var players = data.players;
			for (var player in players) {
				this.spawnPlayer(players[player]);
			}
			// players' data and ship has been initialized and rendered
			this.playerReady = true; // enables update() function
		}.bind(this));


		// Respawn a dead player
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


		// New player joins the Game
		socket.on('add new challenger', function(newPlayer) {
			this.spawnPlayer(newPlayer);
		}.bind(this));


		// Delete player from game on disconnect
		socket.on('remove player', function(id) {
			this.Players[id].displayName.destroy();
			this.Players[id].destroy();
			delete this.Players[id];
		}.bind(this));


		// Update player positions
		socket.on('movement', function(data) {
			var player = this.Players[data.id];
			player.x = data.x;
			player.y = data.y;
			player.facing = data.facing;
			player.animations.play(data.facing);
			this.redrawName(player);
		}.bind(this));

		// Other player was hit (not this player)
		socket.on('player hit', function(data) {
			// destroy bullet
			this.destroyBullet(data.bulletID);
			// destroy shield or player
			this.hitTaken(this.Players[data.id]);
		}.bind(this));

		// Spawn a coin
		socket.on('spawn coin', function(data) {
			this.generateCoin(data);
		}.bind(this));

		// someone picked up a coin; update their bank info and destroy that coin
		socket.on('update bank', function(data) {
			var Coins = this.Coins.children;
			for (var i = 0; i < Coins.length; i++) {
				if (Coins[i].coinID == data.coinID) {
					Coins[i].destroy();
					break;
				}
			}
			this.updateBank(data.id, data.bank);
		}.bind(this));

		// A player has shot (includes me)
		socket.on('shots fired',function(data) {
			this.shoot(data);
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
			// need this for 'player hit' conditionals
			player.shielded = true;
			// create shield at owner's location
			var shield = this.Shields.create(player.x, player.y, 'bubble');
			// give shield the owner's ID
			shield.playerID = data.id;
		}.bind(this));


		socket.on('vertical receipt', function(data) {
			this.updateBank(data.id, data.bank);
			var shooter = this.Players[data.id];
			// shoot down
			var bulletDown = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
			bulletDown.body.velocity.y = this.bulletVelocity;
			bulletDown.bulletID = data.bulletID1;
			// shoot up
			var bulletUp = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
			bulletUp.body.velocity.y = -this.bulletVelocity;
			bulletUp.bulletID = data.bulletID2;
			this.setOOB([bulletDown, bulletUp]);
			this.incrementShotCounter(2);
		}.bind(this));
		

		socket.on('shotgun receipt', function(data) {
				this.updateBank(data.id, data.bank);
				var shooter = this.Players[data.id];
				var bVel = this.bulletVelocity;
				var hVel = bVel/2; // half bullet velocity
				var centerShot;
				var leftShot;
				var rightShot;
				// shooter is facing right
				if (shooter.facing === "right") {
					centerShot = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right'); //x+25+30 | y+25-4
						centerShot.body.velocity.x = bVel;
						centerShot.bulletID = data.bulletID1;
					leftShot = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right');
						leftShot.body.velocity.x = bVel;
						leftShot.body.velocity.y = -hVel;
						leftShot.bulletID = data.bulletID2;
					rightShot = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right');
						rightShot.body.velocity.x = bVel;
						rightShot.body.velocity.y = hVel;
						rightShot.bulletID = data.bulletID3;
				}
				// shooter is facing down
				else if (shooter.facing === "down") {
					centerShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
						centerShot.body.velocity.y = bVel;
						centerShot.bulletID = data.bulletID1;
					leftShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down');
						leftShot.body.velocity.y = bVel;
						leftShot.body.velocity.x = hVel;
						leftShot.bulletID = data.bulletID2;
					rightShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down');
						rightShot.body.velocity.y = bVel;
						rightShot.body.velocity.x = -hVel;
						rightShot.bulletID = data.bulletID3;
				}
				// shooter is facing left
				else if (shooter.facing === "left") {
					centerShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left'); //x+25-30-20 | y+25-4
						centerShot.body.velocity.x = -bVel;
						centerShot.bulletID = data.bulletID1;
					leftShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left');
						leftShot.body.velocity.x = -bVel;
						leftShot.body.velocity.y = hVel;
						leftShot.bulletID = data.bulletID2;
					rightShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left');
						rightShot.body.velocity.x = -bVel;
						rightShot.body.velocity.y = -hVel;
						rightShot.bulletID = data.bulletID3;
				}
				// shooter is facing up
				else if (shooter.facing === "up") {
					centerShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
						centerShot.body.velocity.y = -bVel;
						centerShot.bulletID = data.bulletID1;
					leftShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up');
						leftShot.body.velocity.y = -bVel;
						leftShot.body.velocity.x = -hVel;
						leftShot.bulletID = data.bulletID2;
					rightShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up');
						rightShot.body.velocity.y = -bVel;
						rightShot.body.velocity.x = hVel;
						rightShot.bulletID = data.bulletID3;
				}
			this.setOOB([centerShot, leftShot, rightShot]);
			this.incrementShotCounter(3);
		}.bind(this));


		socket.on('omnishot receipt', function(data){
			this.updateBank(data.id, data.bank);
			var shooter = this.Players[data.id];
			var bVel = this.bulletVelocity;
			var cVel = 300; // custom bullet velocity
			// shoot down
			var bullet1 = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
			bullet1.body.velocity.y = bVel;
			bullet1.bulletID = data.bulletID[0];
			// shoot up
			var bullet2 = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
			bullet2.body.velocity.y = -bVel;
			bullet2.bulletID = data.bulletID[1];
			// shoot left	
			var bullet3 = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left'); //x+25-30-20 | y+25-4
			bullet3.body.velocity.x = -bVel;
			bullet3.bulletID = data.bulletID[2];
			// shoot right
			var bullet4 = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right'); //x+25+30 | y+25-4
			bullet4.body.velocity.x = bVel;
			bullet4.bulletID = data.bulletID[3];
			// up left
			var bullet5 = this.Bullets.create(shooter.x-25, shooter.y-4, 'basic_bullet_left'); //x-5-20 | y-4
			bullet5.body.velocity.y = -cVel;
			bullet5.body.velocity.x = -cVel;
			bullet5.bulletID = data.bulletID[4];
			// up right
			var bullet6 = this.Bullets.create(shooter.x+55, shooter.y-4, 'basic_bullet_right'); //x+50+5 | x-5-20
			bullet6.body.velocity.y = -cVel;
			bullet6.body.velocity.x = cVel;
			bullet6.bulletID = data.bulletID[5];
			// down left
			var bullet7 = this.Bullets.create(shooter.x-25, shooter.y+55, 'basic_bullet_left'); //x-5-20 | y+50+5
			bullet7.body.velocity.y = cVel;
			bullet7.body.velocity.x = -cVel;
			bullet7.bulletID = data.bulletID[6];
			//down right
			var bullet8 = this.Bullets.create(shooter.x+55, shooter.y+55, 'basic_bullet_right'); //x+50+5 | y+50+5
			bullet8.body.velocity.y = cVel;
			bullet8.body.velocity.x = cVel;
			bullet8.bulletID = data.bulletID[7];
			this.setOOB([bullet1, bullet2, bullet3, bullet4, bullet5, bullet6, bullet7, bullet8]);
			this.incrementShotCounter(8);
		}.bind(this));


		socket.on('ultimate receipt', function(data) {
			this.updateBank(data.id, data.bank);
			var myID = this.myID;
			var Ultimates = this.Ultimates;
			var ultSpeed = 1500;
			// needed these 2 to destroy later on 
			var ultimate_origin; // starting point of ult creation so shooter doesn't kill himself
			var bulletMaker; // a setInterval function that gets cleared when finished firing
			var setOOB = this.setOOB.bind(this);
			// disable movement if shooter is me
			if (data.id == this.myID) {
				this.charging = true;
			}
			var shooter = this.Players[data.id];
			// play charging animation
			var aura = Game.add.sprite(shooter.x-18,shooter.y-9,'charging');
			aura.animations.add('charge');
			aura.animations.play('charge',50,false);

			// countdown before firing shot
			setTimeout(function() {
				aura.destroy(); // remove aura from memory
				if (shooter.facing === "right") {
					ultimate_origin = Ultimates.create(shooter.x+60, shooter.y-60, 'ult_origin_right'); //x+30+30 | y-60
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x+150, shooter.y-41.5, 'ult_body_vertical'); //x+30+120 | y-60+18.5
						ultimate_body.body.velocity.x = ultSpeed;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing left
				else if (shooter.facing === "left") {
					ultimate_origin = Ultimates.create(shooter.x-139, shooter.y-60, 'ult_origin_left'); //x-15-124 | y-60
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-125, shooter.y-41.5, 'ult_body_vertical'); //x-5-120 | y-60+18.5
						ultimate_body.body.velocity.x = -ultSpeed;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing down
				else if (shooter.facing === "down") {
					ultimate_origin = Ultimates.create(shooter.x-59, shooter.y+60, 'ult_origin_down');
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-40.5, shooter.y+125, 'ult_body_horizontal'); //x-59+18.5 | y+5+120
						ultimate_body.body.velocity.y = ultSpeed;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing up
				else if (shooter.facing === "up") {
					ultimate_origin = Ultimates.create(shooter.x-59, shooter.y-135, 'ult_origin_up');
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-40.5, shooter.y-120, 'ult_body_horizontal'); //x-59+18.5 | y-120
						ultimate_body.body.velocity.y = -ultSpeed;
						setOOB([ultimate_body]);
					}, 10);
				}
				ultimate_origin.z = 9999; // used to make sure ult bullets don't overlap origin sprite
			}, 500);
			// called to stop shooting ult and enable player movement
			setTimeout(function() { 
				ultimate_origin.destroy();
				clearInterval(bulletMaker);
				if (myID == data.id) {
					playState.charging = false; // don't know how to bind this.charging inside setTimeout so gotta resort to using this
				}
			}, 1000); // fires ult for X ms
		}.bind(this));



	},

	spawnPlayer: function(user) {
		// have server send over which ship to render as well
		this.Players[user.id] = Game.add.sprite(user.x, user.y, user.ship);

		var player = this.Players[user.id];
		player.id = user.id;
		player.facing = user.facing;
		player.shielded = user.shielded;
		// player.charging = false; // note: might have to have this data stored on server in case user connects while player is charging as opposed to respawning
		player.animations.add('right',[0],1,true);
		player.animations.add('down',[1],1,true);
		player.animations.add('left',[2],1,true);
		player.animations.add('up',[3],1,true);
		player.animations.play(user.facing);
		
		Game.physics.arcade.enable(player);
		player.body.collideWorldBounds = true;
		this.updateBank(user.id, user.bank);

		// Display Name above ship
		player.displayName = Game.add.text(user.x, user.y, user.id, {fontSize: '10px', fill:'red'});
		// set self name color to black
		if (player.id == this.myID) {
			player.displayName.fill = 'black';
		}
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


	///////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////// PHASER UPDATE()
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

		////////////////////////////////////////////////////////// PLAYER MOVEMENT
  	this.Players[this.myID].body.velocity.set(0); // stop movement
	  if (this.cursors.down.isDown && this.cursors.up.isDown) { return; }
	  else if (this.cursors.up.isDown) {
	  	if (!this.charging) {
		    this.Players[this.myID].body.velocity.y = -300;
		  }
	    this.Players[this.myID].facing = "up";
	    this.Players[this.myID].animations.play('up');
	    this.playerMoved = true;
	  }
	  else if (this.cursors.down.isDown) {
	  	if (!this.charging) {
		    this.Players[this.myID].body.velocity.y = 300;
		  }
	    this.Players[this.myID].facing = "down";
	    this.Players[this.myID].animations.play('down');
	    this.playerMoved = true;
	  }
	  if (this.cursors.left.isDown && this.cursors.right.isDown) { return; }
	  else if (this.cursors.left.isDown) {
	  	if (!this.charging) {
		  	this.Players[this.myID].body.velocity.x = -300;
		  }
	  	this.Players[this.myID].facing = "left";
	  	this.Players[this.myID].animations.play('left');
	  	this.playerMoved = true;
	  }
	  else if (this.cursors.right.isDown) {
	  	if (!this.charging) {
		  	this.Players[this.myID].body.velocity.x = 300;
		  }
	  	this.Players[this.myID].facing = "right";
	  	this.Players[this.myID].animations.play('right');
	  	this.playerMoved = true;
	  }
		// check of another user is connected before blasting the server
		// if (this.playerCounter > 1 && this.playerMoved) {
			// Display Name above ship
			this.redrawName(this.Players[this.myID]);
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
	  	this.incrementShotCounter(1);
			socket.emit('shoot', {
				id: this.myID, 
				facing: this.Players[this.myID].facing 
			});
		}

		/////////////////////////////// COLLISIONS
	  Game.physics.arcade.collide(this.Players[this.myID], this.Bullets, this.imHit, null, this);
	  Game.physics.arcade.overlap(this.Players[this.myID], this.Coins, this.getRich, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Players[this.myID], this.obliterate, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Coins, this.obliterate, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Bullets, this.obliterate, null, this);
	  
	  //////////////////////////////// OTHERS
	  // tell server to generate coins every 4-12 seconds
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
	},

	//////////////////////////////////////////////////////////// PLAYER HIT
	// LOCAL CLIENT WAS HIT
	imHit: function(player, bullet) {
		// destroy bullet
		this.destroyBullet(bullet.bulletID);
		// destroy shield or playser
		var alive = this.hitTaken(player);
		// send out player's id and bullet's id
		socket.emit('im hit', {
			id: player.id,
			bulletID: bullet.bulletID,
			alive: alive
		});
	},

	///////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////// MONEY STUFF
	// SERVER-GENERATED RANDOM COIN
	generateCoin: function(data) {
		// x, y, coinID, type
		var coin = this.Coins.create(data.x, data.y, data.type);
		coin.value = data.value;
		coin.coinID = data.coinID;
		coin.animations.add('rotate');
		coin.animations.play('rotate',20,true);
		// Coin expires as set by server
		setTimeout(function() {
			coin.destroy();
		}, data.expire);
	},

	// LOCAL CLIENT PICKS UP COIN
	getRich: function(player, coin) {
		// remove coin from my own screen to prevent multiple pickups due to laggy computer
		coin.kill();
		socket.emit('coin touched', {
			id: player.id,
			coinID: coin.coinID, 
			value: coin.value
		});
	},

	//////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////// SHOPPING FUCTIONS
	//////////////////////////////////////////////// UPGRADE GUN
	upgradeGun: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive && this.shotLevel < 5) //400
			socket.emit('upgrade');
	},
	//////////////////////////////////////////////////////////// SHIELD
	buyShield: function() {
		if (this.Players[this.myID].bank >= 0 && !this.Players[this.myID].shielded && this.alive) //350
			socket.emit('shield');
	},
	/////////////////////////////////////////////////////////// VERTICAL SHOT
	buyVertical: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) //350
			socket.emit('vertical');
	},
	/////////////////////////////////////////////////////////// SHOTGUN SHOT
	buyShotgun: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) // 500
			socket.emit('shotgun');
	},
	///////////////////////////////////////////////////////////// 8 WAY SHOT!!!
	buyOmnishot: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) // 900
			socket.emit('omnishot');
	},
	//////////////////////////////////////////////////////////////// Ultimate
	buyUltimate: function() {
		if (this.Players[this.myID].bank >= 000 && this.alive) // 1000
			socket.emit('ultimate');
	},
	///////////////////////////////////////////////////// ULTIMATE HITS SOMETHING
	// kill anything that touches the ultimate
	obliterate: function(victim, ultimate) {
		if (this.Players[this.myID] === victim) {
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

	/**
	 * Redraw Name
	 */
	redrawName: function(player) {
		// Display Name above ship
		player.displayName.x = player.x;
		player.displayName.y = player.y;
	},


	/**
	 * Redraws shields so they follow its ship
	 */
	redrawShields: function() {
		this.Shields.children.forEach(function(shield) {
			var player = this.Players[shield.playerID];
			shield.position.set(player.x-2.5,player.y-2.5);
		}.bind(this));
	},

	/**
	 * Updates a player's bank
	 * @param  {string} id      Player ID
	 * @param  {int} newBank Current bank value of player
	 */
	updateBank: function(id, newBank) {
		this.Players[id].bank = newBank;
		if (id == this.myID) {
			this.bankOutput.text = 'Bank: ' + newBank;
		}
		else {
			// note: for other players if you want to display their bank under their ship
		}
	},

	/**
	 * Set out-of-bounds for bullets so they can be destroyed later
	 * @param {array} bullets Set of bullets to be given out-of-bounds parameter
	 */
	setOOB: function(bullets) {
		bullets.forEach(function(bullet) {
			bullet.checkWorldBounds = true;
			bullet.outOfBoundsKill = true;
		});
	},

	/**
	 * Destroy all out-of-bound bullets and ultimates (technically, when they're invisible) to free memory
	 * does this weird thing that clears, at most, half the bullets at a time
	 */
	destroyBullets: function() {
		this.Bullets.children.forEach(function(bullet) {
			if (!bullet.visible) {
				bullet.destroy();
			}
		});
		this.Ultimates.children.forEach(function(thing) {
			if (!thing.visible) {
				thing.destroy();
			}
		});
	},

	/**
	 * Destroys a shield or kills player
	 * @param  {object} player Player that was shot
	 * @return {bool}        Is player still alive?
	 */
	hitTaken: function(player) {
		if (player.shielded) { // if shielded
			player.shielded = false;
			var shields = this.Shields.children;
			for (var s = 0; s < shields.length; s++) {
				if (shields[s].playerID == player.id) {
					shields[s].destroy();
					// return true if player is still alive
					return true;
				}
			}
			console.log("ERROR: Couldn't find shield but player.shielded was = true");
			return true;
		}
		// else
		// if killed ship is me
		if (player.id == this.myID) {
			this.alive = false;
			// set timeout for the player to respawn and reset shotCounter
			var lifetimeShots = this.lifetimeShots;
			setTimeout(function() {
				socket.emit('respawn me');
				lifetimeShots = 0;
			}, 2000);
		}
		// destroy the ship
		player.kill();
		this.Players[player.id].alive = false;
		//  EXPLODE ANIMATION
		var explode = Game.add.sprite(player.x-35, player.body.center.y-40,'explode1');
		explode.animations.add('explode');
		explode.animations.play('explode',10);
		// return false if player exploded (had no shield)
		return false;
	
	},

	/**
	 * Destroys a single bullet that hit a ship
	 * @param  {int} bulletID ID of the bullet to be destroyed
	 * @return {null}          Used to end for loop when bullet is found and destroyed
	 */
	destroyBullet: function(bulletID) {
		var bullets = this.Bullets.children;
			// destroy bullet
			for (var i = 0; i < bullets.length; i++) {
				if (bullets[i].bulletID == bulletID) {
					bullets[i].destroy();
					return;
				}
			}
	},

	/**
	 * Increase shot counters by specified number
	 * @param  {int} n Number to increase counters by
	 */
	incrementShotCounter: function(n) {
		this.sessionShots += n;
		this.sessionShotNum.text = this.sessionShots;
		this.lifetimeShots += n;
		this.lifetimeShotNum.text = this.lifetimeShots;
	}
	


};

