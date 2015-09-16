console.log('game.js linked')

var game = new Phaser.Game(1280,720, Phaser.AUTO, 'game-area', {preload:preload,create:create,update:update})

var bank = 0;
var bankOutput;
var lives = 4;
var bullets;

function preload() {
	game.load.image('sky','images/sky.jpg');
	game.load.image('ship', 'images/ship.gif');
	// game.load.image('ship', 'images/spaceship.png');
	game.load.image('basic_bullet_right','images/basic_bullet_right.png')
	game.load.image('basic_bullet_down','images/basic_bullet_down.png')
	game.load.image('basic_bullet_left','images/basic_bullet_left.png')
	game.load.image('basic_bullet_up','images/basic_bullet_up.png')
	// game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

	// width, height [, # of frames [of sprite img]]
	game.load.spritesheet('gold_coin', 'images/gold_coin.png', 32, 32, 8)
	game.load.spritesheet('copper_coin', 'images/copper_coin.png',35.2,32)
	game.load.spritesheet('silver_coin', 'images/silver_coin_float.png',32,32)
	game.load.spritesheet('explode1', 'images/explode1.png', 100, 100, 9)
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

	gold_coin = gold_coins.create(100,100,'gold_coin')
	gold_coin.value = 500
	gold_coin.animations.add('rotate')
	gold_coin.animations.play('rotate',20,true)
	setTimeout(function() { gold_coin.kill() ; }, Math.floor(Math.random() * 10000)+5000)

	/////////////////////////// SILVER COIN
	silver_coins = game.add.group()
	silver_coins.enableBody = true;
	silver_coin = silver_coins.create(200,300,'silver_coin')
	silver_coin.value = 200
	silver_coin.animations.add('rotate')
	silver_coin.animations.play('rotate',20,true)
	setTimeout(function() { silver_coin.kill() ; }, Math.floor(Math.random() * 10000)+10000)
	/////////////////////////// COPPER COIN
	copper_coins = game.add.group()
	copper_coins.enableBody = true;
	copper_coin = copper_coins.create(0,300,'copper_coin')
	copper_coin.value = 50
	copper_coin.animations.add('rotate')
	copper_coin.animations.play('rotate',20,true)
	setTimeout(function() { copper_coin.kill() ; }, Math.floor(Math.random() * 10000)+10000)
	//////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////// PLAYER OPTIONS
	spawnPlayer();
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
	// bullets.create(player.position.x+100, player.position.y+34, 'basic_bullet_horizontal')
	// bullets.create(200, 500, 'basic_bullet_horizontal')
	///////////////////////////////////////////////////////////////////

	///////////////////////////////////////////// ENABLE PLAYER CONTROLS
	cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  // var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  // changeKey.onDown.add(this.nextWeapon, this);
  ///////////////////////////////////////////////////////////////////
}

function update() {
	
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

}

function spawnPlayer() {
	player = game.add.sprite(0, 0, 'sship');
	// player.weapons = []
	player.animations.add('right',[0],1,true);
	player.animations.add('down',[1],1,true);
	player.animations.add('left',[2],1,true);
	player.animations.add('up',[3],1,true);
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
}


///////////////////////////////////////////// PLAYER COLLISION FUNCTION
function playerHit(player, bullet) {
	//  EXPLODE ANIMATION
	explode = game.add.sprite(player.body.center.x-50, player.body.center.y-50,'explode1')
	explode.animations.add('explode')
	explode.animations.play('explode',10)
	/////////////////////////////////////////////////////////////////////
	player.kill()
	bullet.kill()

}

var shotTimer = 0
var shotCooldown = 500
////////////////////////////////////////////////////////////// SHOOTING
function shoot() {
	if (shotTimer < game.time.now) {
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
	coin.kill()
	bank += coin.value
	bankOutput.text = 'Bank: '+bank;
}


function purchaseItem(item) {
	// compare bank with item.cost
	// if pass then... 
		// remove .cost from bank
		// enable/disable buttons
		// enable item ability
}