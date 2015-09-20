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