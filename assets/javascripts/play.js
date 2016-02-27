/*
find "note:" for things I should add into the code


Bugs:
shields dont appear on my screen when opponent purchases it
opponent doesn't respawn on my screen but does on his. if we kill each other once each, we never see each other again since Players[id].alive = false forever
firing a bullet inside an opponent doesn't kill them, and creates a bug where the next bullet shot, and hits opponent, doesn't get destroyed

FYI:
shot cd starts at 800
at 4 upgrades, it drops to 327.68
at 5 upgrades, it goes drops to 262.144
	you can still dodge between bullets at this shot interval


Bugs
Laggy computers get to pick up one coin multiple times SOLVED USING .kill() ON LOCAL SIDE
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
	shotTimer: 0,
	shotLevel: 0,
	shotCooldown: 800,
	bulletVelocity: 400,
	
	Shields: null, // group of all shields
	Ultimates: null,
	ultimateShots: 0,
	ultimateShotOutput: null,
	charging: false, // charging to fire ultimate

	Players: {},
	playerCounter: 0, // greater than 1 == send server movement data

	// for Meta data
	shotLevelOutput: null,
	shotSpeedOutput: null,

	shieldCounter: 0,
	shieldOutput: null,

	sessionShots: 0, // total number of shots made since joining the game
	sessionShotOutput: null,
	lifetimeShots: 0, // number of shots made since last (re)spawn
	lifetimeShotOutput: null,
	
	kills: 0, // total number of kills
	killsOutput: null,
	
	killstreak: 0,
	killstreakOutput: null,
	
	bestKillstreak: 0,
	bestKillstreakOutput: null,
	
	deaths: 0,
	deathsOutput: null,

	cursors: null, // for player controls

	create: function() {
		//////////////////////////////////// RENDER BACKGROUND STUFF FIRST
		Game.add.sprite(0, 0, 'sky');
		Game.add.sprite(0, 600, 'bottom_bar');
		///////////////////////// GAME TEXT
		// bank text
		this.bankOutput = Game.add.text(550, 600, 'Bank: 0',{fontSize: '16px', fill: '#83FF59'});
		Game.add.text(1030, 605, "STATS", {fontSize: '14px', fill: 'black', fontStyle: 'italic'});
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
		// Meta Data Output
		// upgrade
		Game.add.text(850, 630, "Upgrade LvL:", {fontSize: '14px', fill: 'white'});
		this.shotLevelOutput = Game.add.text(948, 630, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(850, 650, "Gun Speed:", {fontSize: '14px', fill: 'white'});
		this.shotSpeedOutput = Game.add.text(948, 650, "800", {fontSize: '14px', fill: 'orange'});
		// shields
		Game.add.text(850, 670, "Shields Used:", {fontSize: '14px', fill: 'white'});
		this.shieldOutput = Game.add.text(948, 670, "0", {fontSize: '14px', fill: 'orange'});
		// # of shots fired
		Game.add.text(983, 630, "Total Shots:", {fontSize: '14px', fill: 'white'});
		this.sessionShotOutput = Game.add.text(1090, 630, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(983, 650, "Lifetime Shots:", {fontSize: '14px', fill: 'white'});
		this.lifetimeShotOutput = Game.add.text(1090, 650, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(983, 670, "Ultimates:", {fontSize: '14px', fill: 'white'});
		this.ultimateShotOutput = Game.add.text(1090, 670, "0", {fontSize: '14px', fill: 'orange'});
		// kills / deaths
		Game.add.text(1140, 630, "Killstreak:", {fontSize: '14px', fill: 'white'});
		this.killstreakOutput = Game.add.text(1248, 630, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(1140, 650, "Best Killstreak:", {fontSize: '14px', fill: 'white'});
		this.bestKillstreakOutput = Game.add.text(1248, 650, "0", {fontSize: '14px', fill: 'yellow'});
		Game.add.text(1140, 670, "Kills:", {fontSize: '14px', fill: 'white'});
		this.killsOutput = Game.add.text(1248, 670, "0", {fontSize: '14px', fill: 'orange'});
		Game.add.text(1140, 690, "Deaths:", {fontSize: '14px', fill: 'white'});
		this.deathsOutput = Game.add.text(1248, 690, "0", {fontSize: '14px', fill: 'red'});
		//////////////////////////////////////////////////// GAME OPTIONS
		Game.world.setBounds(0, 0, 1280, 600);
		Game.physics.startSystem(Phaser.Physics.ARCADE);
		Game.renderer.renderSession.roundPixels = true;
		// Clean Up Bullets
		var clearbullets = this.destroyBullets.bind(this);
		setInterval(function() {
			clearbullets();
		}, 5000);

		///////////////////////// ENABLE PLAYER CONTROLS
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

		/////////////////////////////////////////////// WORLD ITEM OPTIONS
		this.Coins = Game.add.group();
		this.Coins.enableBody = true;

		//////////////////////////////////////////////////// BULLET OPTIONS
		this.Bullets = Game.add.group();
		this.Bullets.enableBody = true;
		Game.physics.arcade.enable(this.Bullets);
		this.Ultimates = Game.add.group();
		this.Ultimates.enableBody = true;
		Game.physics.arcade.enable(this.Ultimates);
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
		/**
		 * Init: Grabs all players' data
		 * @param  {object} data This player's data and all other players' data in data.players object
		 */
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


		/**
		 * Respawn a dead player
		 * @param  {object} data Contains respawning player's new random coords and resets sprite
		 */
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


		/**
		 * New player joins the Game
		 * @param  {object} newPlayer Newly generated player data
		 */
		socket.on('add new challenger', function(newPlayer) {
			this.spawnPlayer(newPlayer);
		}.bind(this));


		/**
		 * Delete player from game on disconnect
		 * @param  {string} id Player id to remove
		 */
		socket.on('remove player', function(id) {
			this.Players[id].displayName.destroy();
			this.Players[id].destroy();
		}.bind(this));


////////////////////////////////////////////////////// Others

		/**
		 * Update player positions
		 * @param  {object} data Contains moving player's new location and heading
		 */
		socket.on('movement', function(data) {
			var player = this.Players[data.id];
			player.x = data.x;
			player.y = data.y;
			player.facing = data.facing;
			player.animations.play(data.facing);
			this.redrawName(player); // redraw opponents' names above their ships
		}.bind(this));

		/**
		 * Other player was hit (not this player)
		 * @param  {object} data Contains player id, bullet id
		 */
		socket.on('player hit', function(data) {
			// destroy bullet
			if (data.bulletID != 'x') {
				this.destroyBullet(data.bulletID);
			}
			// destroy shield or player
			this.hitTaken(this.Players[data.id]);
			// if player opponent died and shooter was me, increment my kill count
			if (!data.alive && data.killer == this.myID) {
				this.incrementKillCount();
			}
		}.bind(this));

		/**
		 * Spawn a coin
		 * @param  {object} data Contains all data for generating a coin
		 */
		socket.on('spawn coin', function(data) {
			this.generateCoin(data);
		}.bind(this));

		/**
		 * Someone picked up a coin; update their bank amount and destroy that coin
		 * @param  {object} data Contains player's id, updated bank, and coin id
		 */
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


																																				///////////////////////
////////////////////////////////////////////////////////////////////////// PURCHASE RECEIPTS //
																																				///////////////////////
		/**
		 * A player has shot a normal bullet (includes me)
		 * @param  {object} data Contains player id and heading/facing
		 */
		socket.on('shots fired',function(data) {
			this.shoot(data);
		}.bind(this));

		/**
		 * Upgrades gun speed; results applied only to customer
		 * @param  {object} data Contains player id and new bank information
		 */
		socket.on('upgrade receipt', function(data) {
			if (data.id === this.myID) {
				this.shotLevel++;
				this.shotCooldown *= 0.8;
				// update shot level output; says "Max" if level == 5
				this.shotLevelOutput.text = this.shotLevel < 5 ? this.shotLevel : "Max";
				this.shotSpeedOutput.text = Math.floor(this.shotCooldown);
			}
			this.updateBank(data.id, data.bank);
		}.bind(this));

		/**
		 * Creates a shield
		 * @param  {object} data Contains player id, bank info
		 */
		socket.on('shield receipt', function(data) {
			var player = this.Players[data.id];
			// need this for 'player hit' conditionals
			player.shielded = true;
			// create shield at owner's location
			var shield = this.Shields.create(player.x, player.y, 'bubble');
			// give shield the owner's ID
			shield.playerID = data.id;
			if (this.myID == data.id) {
				this.shieldOutput.text = ++this.shieldCounter;
			}
			this.updateBank(data.id, data.bank);
		}.bind(this));

		/**
		 * Fires two bullets; up and down
		 * @param  {object} data Contains playerid, bullet ids, bank info
		 */
		socket.on('vertical receipt', function(data) {
			var shooter = this.Players[data.id];
			// shoot down
			var bulletDown = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
			bulletDown.body.velocity.y = this.bulletVelocity;
			// shoot up
			var bulletUp = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
			bulletUp.body.velocity.y = -this.bulletVelocity;
			
			this.setBulletID([bulletDown,bulletUp], data.bulletID, data.id);
			this.setOOB([bulletDown, bulletUp]);
			this.incrementShotCounter(2);
			this.updateBank(data.id, data.bank);
		}.bind(this));
		
		/**
		 * Fires three bullets
		 * @param  {object} data Contains player id, bullet ids, bank info
		 */
		socket.on('shotgun receipt', function(data) {
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
				leftShot = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right');
					leftShot.body.velocity.x = bVel;
					leftShot.body.velocity.y = -hVel;
				rightShot = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right');
					rightShot.body.velocity.x = bVel;
					rightShot.body.velocity.y = hVel;
			}
			// shooter is facing down
			else if (shooter.facing === "down") {
				centerShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
					centerShot.body.velocity.y = bVel;
				leftShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down');
					leftShot.body.velocity.y = bVel;
					leftShot.body.velocity.x = hVel;
				rightShot = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down');
					rightShot.body.velocity.y = bVel;
					rightShot.body.velocity.x = -hVel;
			}
			// shooter is facing left
			else if (shooter.facing === "left") {
				centerShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left'); //x+25-30-20 | y+25-4
					centerShot.body.velocity.x = -bVel;
				leftShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left');
					leftShot.body.velocity.x = -bVel;
					leftShot.body.velocity.y = hVel;
				rightShot = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left');
					rightShot.body.velocity.x = -bVel;
					rightShot.body.velocity.y = -hVel;
			}
			// shooter is facing up
			else if (shooter.facing === "up") {
				centerShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
					centerShot.body.velocity.y = -bVel;
				leftShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up');
					leftShot.body.velocity.y = -bVel;
					leftShot.body.velocity.x = -hVel;
				rightShot = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up');
					rightShot.body.velocity.y = -bVel;
					rightShot.body.velocity.x = hVel;
			}

			this.setBulletID([centerShot,leftShot,rightShot], data.bulletID, data.id);
			this.setOOB([centerShot, leftShot, rightShot]);
			this.incrementShotCounter(3);
			this.updateBank(data.id, data.bank);
		}.bind(this));

		/**
		 * Fires 8 bullets
		 * @param  {object} data Contains player id, bullet ids, bank info
		 */
		socket.on('omnishot receipt', function(data){
			var shooter = this.Players[data.id];
			var bVel = this.bulletVelocity;
			var cVel = 300; // custom bullet velocity
			// shoot down
			var bullet1 = this.Bullets.create(shooter.x+20, shooter.y+55, 'basic_bullet_down'); //x+25-5 | y+25+30
			bullet1.body.velocity.y = bVel;
			// shoot up
			var bullet2 = this.Bullets.create(shooter.x+20, shooter.y-25, 'basic_bullet_up'); //x+25-5 | y+25-30-20
			bullet2.body.velocity.y = -bVel;
			// shoot left	
			var bullet3 = this.Bullets.create(shooter.x-25, shooter.y+21, 'basic_bullet_left'); //x+25-30-20 | y+25-4
			bullet3.body.velocity.x = -bVel;
			// shoot right
			var bullet4 = this.Bullets.create(shooter.x+55, shooter.y+21, 'basic_bullet_right'); //x+25+30 | y+25-4
			bullet4.body.velocity.x = bVel;
			// up left
			var bullet5 = this.Bullets.create(shooter.x-25, shooter.y-4, 'basic_bullet_left'); //x-5-20 | y-4
			bullet5.body.velocity.y = -cVel;
			bullet5.body.velocity.x = -cVel;
			// up right
			var bullet6 = this.Bullets.create(shooter.x+55, shooter.y-4, 'basic_bullet_right'); //x+50+5 | x-5-20
			bullet6.body.velocity.y = -cVel;
			bullet6.body.velocity.x = cVel;
			// down left
			var bullet7 = this.Bullets.create(shooter.x-25, shooter.y+55, 'basic_bullet_left'); //x-5-20 | y+50+5
			bullet7.body.velocity.y = cVel;
			bullet7.body.velocity.x = -cVel;
			//down right
			var bullet8 = this.Bullets.create(shooter.x+55, shooter.y+55, 'basic_bullet_right'); //x+50+5 | y+50+5
			bullet8.body.velocity.y = cVel;
			bullet8.body.velocity.x = cVel;
			
			this.setBulletID([bullet1, bullet2, bullet3, bullet4, bullet5, bullet6, bullet7, bullet8], data.bulletID, data.id);
			this.setOOB([bullet1, bullet2, bullet3, bullet4, bullet5, bullet6, bullet7, bullet8]);
			this.incrementShotCounter(8);
			this.updateBank(data.id, data.bank);
		}.bind(this));

		/**
		 * Fires a big laser
		 * @param  {object} data Contains player id, bank info
		 */
		socket.on('ultimate receipt', function(data) {
			var shooter = this.Players[data.id];
			var myID = this.myID;
			var Ultimates = this.Ultimates;
			var ultSpeed = 1500;
			// needed these 2 to destroy later on 
			var ultimate_origin; // starting point of ult creation so shooter doesn't kill himself
			var bulletMaker; // a setInterval function that gets cleared when finished firing
			var setOOB = this.setOOB.bind(this);
			// disable movement if shooter is me
			if (data.id == this.myID) {
				this.charging = true; // stop player movement
				this.ultimateShotOutput.text = ++this.ultimateShots; // increment ultimate shot counter
			}
			// play charging animation
			var aura = Game.add.sprite(shooter.x-18,shooter.y-9,'charging');
			aura.animations.add('charge');
			aura.animations.play('charge', 50, false);

			// Waits 500ms before firing
			setTimeout(function() {
				aura.destroy(); // remove aura from memory
				if (shooter.facing === "right") {
					ultimate_origin = Ultimates.create(shooter.x+60, shooter.y-60, 'ult_origin_right'); //x+30+30 | y-60
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x+150, shooter.y-41.5, 'ult_body_vertical'); //x+30+120 | y-60+18.5
						ultimate_body.body.velocity.x = ultSpeed;
						ultimate_body.playerID = data.id;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing left
				else if (shooter.facing === "left") {
					ultimate_origin = Ultimates.create(shooter.x-139, shooter.y-60, 'ult_origin_left'); //x-15-124 | y-60
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-125, shooter.y-41.5, 'ult_body_vertical'); //x-5-120 | y-60+18.5
						ultimate_body.body.velocity.x = -ultSpeed;
						ultimate_body.playerID = data.id;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing down
				else if (shooter.facing === "down") {
					ultimate_origin = Ultimates.create(shooter.x-59, shooter.y+60, 'ult_origin_down');
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-40.5, shooter.y+125, 'ult_body_horizontal'); //x-59+18.5 | y+5+120
						ultimate_body.body.velocity.y = ultSpeed;
						ultimate_body.playerID = data.id;
						setOOB([ultimate_body]);
					}, 10);
				}
				// shooter is facing up
				else if (shooter.facing === "up") {
					ultimate_origin = Ultimates.create(shooter.x-59, shooter.y-135, 'ult_origin_up');
					bulletMaker = setInterval(function() {
						var ultimate_body = Ultimates.create(shooter.x-40.5, shooter.y-120, 'ult_body_horizontal'); //x-59+18.5 | y-120
						ultimate_body.body.velocity.y = -ultSpeed;
						ultimate_body.playerID = data.id;
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
			this.updateBank(data.id, data.bank);
		}.bind(this));



	}, // end create()



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
		if (!this.playerReady) {
			console.log('player not ready, update() stopping');
			return;
		}

		/////////////////////////////// COLLISIONS
	  Game.physics.arcade.collide(this.Players[this.myID], this.Bullets, this.imHit, null, this);
	  Game.physics.arcade.overlap(this.Players[this.myID], this.Coins, this.getRich, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Players[this.myID], this.obliterate, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Coins, this.obliterateItem, null, this);
	  Game.physics.arcade.overlap(this.Ultimates, this.Bullets, this.obliterateItem, null, this);
	  // Game.physics.arcade.overlap(this.Ultimates, this.Ultimates, this.ultimateClash, null, this);
	  
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
		// only allow player controls if player is alive
		if (this.alive) {
			// check if shot timer is ok, check if spacebar was pressed
		  if (Game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.shotTimer < Game.time.now) {
		  	this.shotTimer = Game.time.now + this.shotCooldown;
		  	this.incrementShotCounter(1);
				socket.emit('shoot', {
					id: this.myID,
					facing: this.Players[this.myID].facing
				});
			}

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
				// Display this player's name above ship
				this.redrawName(this.Players[this.myID]);
				socket.emit('movement', {
					id: this.myID,
					x: this.Players[this.myID].body.x,
					y: this.Players[this.myID].body.y, 
					facing: this.Players[this.myID].facing
				});
			// }
		}
	}, // end update()


	////////////////////////////////////////////////////////////////////////////// SPAWNING
	
	/**
	 * Spawns player by creating an entire sprite entity
	 * @param  {object} user All data needed to spawn player and his current stats and information
	 */
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


	////////////////////////////////////////////////////////////// SHOOTING

	/**
	 * Create bullet near player who shot
	 * @param  {object} data Contains player id, player facing, bullet id
	 */
	shoot: function(data) {
		var player = this.Players[data.id];
		var bullet;
		// shooter is facing right
		if (data.facing === "right") {
			bullet = this.Bullets.create(player.x+25+30, player.y+25-4, 'basic_bullet_right');
			bullet.body.velocity.x = 400;
		}
		// shooter is facing down
		else if (data.facing === "down") {
			bullet = this.Bullets.create(player.x+25-5, player.y+25+30, 'basic_bullet_down');
			bullet.body.velocity.y = 400;
		}
		// shooter is facing left
		else if (data.facing === "left") {
			bullet = this.Bullets.create(player.x+25-30-20, player.y+25-4, 'basic_bullet_left');
			bullet.body.velocity.x = -400;
		}
		// shooter is facing up
		else if (data.facing === "up") {
			bullet = this.Bullets.create(player.x+25-5, player.y+25-30-20, 'basic_bullet_up');
			bullet.body.velocity.y = -400;
		}
		this.setBulletID([bullet], data.bulletID, data.id);
		// makes sure that all bullets are killed upon leaving world bounds
		this.setOOB([bullet]);
	},


	//////////////////////////////////////////////////////////// OBJECT COLLISION / DESTRUCTION
	/**
	 * This player made contact with a bullet
	 * @param  {object} player Player object
	 * @param  {object} bullet Bullet object
	 */
	imHit: function(player, bullet) {
		// destroy bullet
		bullet.destroy();
		// this.destroyBullet(bullet.bulletID);
		// destroy shield or playser
		var alive = this.hitTaken(player);
		// send out player's id and bullet's id
		socket.emit('im hit', {
			id: player.id,
			bulletID: bullet.bulletID,
			alive: alive,
			killer: bullet.playerID
		});
		// if this player died, reset killstreak and increment death counter
		if (!alive) {
			this.killstreak = 0;
			this.killstreakOutput.text = 0;
			this.deathsOutput.text = ++this.deaths;
		}
	},

		/**
	 * Destroys a shield or kills opponent player
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


	//////////////////////////////////////////////////////////////// MONEY STUFF
	/**
	 * Creates a coin sprite with its data
	 * @param  {object} data Contains coin's information (uid, coords, value, expiry)
	 */
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

	/**
	 * This player touches/picks up a coin
	 * @param  {object} player Player Object
	 * @param  {object} coin   Coin object touched
	 */
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
	
	upgradeGun: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive && this.shotLevel < 5) //400
			socket.emit('upgrade');
	},
	
	buyShield: function() {
		if (this.Players[this.myID].bank >= 0 && !this.Players[this.myID].shielded && this.alive) //350
			socket.emit('shield');
	},
	
	buyVertical: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) //350
			socket.emit('vertical');
	},
	
	buyShotgun: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) // 500
			socket.emit('shotgun');
	},
	
	buyOmnishot: function() {
		if (this.Players[this.myID].bank >= 00 && this.alive) // 900
			socket.emit('omnishot');
	},
	
	buyUltimate: function() {
		if (this.Players[this.myID].bank >= 000 && this.alive) // 1000
			socket.emit('ultimate');
	},
	
	//////////////////////////////////////////////////////////// ULTIMATE HITS SOMETHING
	// kill anything that touches the ultimate
	// if hitting a player | first is player, second is ult
	obliterate: function(victim, ultimate) {
		// destroy shield or playser
		var alive = this.hitTaken(victim);
		// send out player's id and bullet's id
		socket.emit('im hit', {
			id: victim.id,
			bulletID: 'x',
			alive: alive,
			killer: ultimate.playerID
		});
		// if this player died, reset killstreak and increment death counter
		if (!alive) {
			this.killstreak = 0;
			this.killstreakOutput.text = 0;
			this.deathsOutput.text = ++this.deaths;
		}
	},

	// if hitting a coin | first is ult, second is coin
	// if hitting a bullet | first is ult, second is bullet
	/**
	 * Destroy world object if ultimate hits it
	 * @param  {object} ultimate Ultimate beam
	 * @param  {object} item     World item that was hit
	 */
	obliterateItem: function(ultimate, item) {
		item.destroy();
	},

	/**
	 * When two ultimates clash, destroy both | wont work since creating ultimates are, by default, overlapping
	 * @param  {object} ultimate1 Ult 1
	 * @param  {object} ultimate2 Ult 2
	 */
	// ultimateClash: function(ultimate1, ultimate2) {
	// 	ultimate1.destroy();
	// 	ultimate2.destroy();
	// },



	/**
	 * Redraws name to follow its player
	 * @param  {object} player Player object
	 */
	redrawName: function(player) {
		// Display Name above ship
		player.displayName.x = player.x;
		player.displayName.y = player.y;
	},


	/**
	 * Redraws shields to follow its ship
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
	 * Sets bullet id and player id to bullets
	 * @param {array} bullets Array of newly created
	 * @param {array} ids     Array of bullet ids
	 * @param {string} playerID  shooter's player id
	 */
	setBulletID: function(bullets, bulletIDs, playerID) {
		for (var i = 0; i < bullets.length; i++) {
			bullets[i].bulletID = bulletIDs[i];
			bullets[i].playerID = playerID;
		}
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
	 * Destroys a single bullet that hit a ship
	 * @param  {int} bulletID ID of the bullet to be destroyed
	 * @return {undefined}    Used to end the for loop when bullet is found and destroyed
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
		this.sessionShotOutput.text = this.sessionShots;
		this.lifetimeShots += n;
		this.lifetimeShotOutput.text = this.lifetimeShots;
	},


	incrementKillCount: function() {
		this.killsOutput.text = ++this.kills;
		this.killstreakOutput.text = ++this.killstreak;
		if (this.killstreak > this.bestKillstreak) {
			this.bestKillstreak = this.killstreak;
			this.bestKillstreakOutput.text = this.killstreak;
		}

	}
	


}; // end playState{}

