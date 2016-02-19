var loadState = {
	preload: function() {

		var loadingText = Game.add.text(580, 350, 'loading chaos...', {fontSize:'16px', fill:'orange'});

		Game.load.image('sky','images/sky.jpg');
		Game.load.image('bottom_bar', 'images/bottom_bar.png');
		Game.load.image('vertical_icon','images/vertical_icon.png');
		Game.load.image('shotgun_icon','images/shotgun_icon.png');
		Game.load.image('upgrade_icon','images/upgrade_icon.png');
		Game.load.image('omni_icon','images/omni_icon.png');
		Game.load.image('ult_icon','images/ult_icon.png');
		Game.load.image('basic_bullet_right','images/basic_bullet_right.png');
		Game.load.image('basic_bullet_down','images/basic_bullet_down.png');
		Game.load.image('basic_bullet_left','images/basic_bullet_left.png');
		Game.load.image('basic_bullet_up','images/basic_bullet_up.png');
		Game.load.image('bubble','images/bubble.png');
		Game.load.image('ult_body_horizontal','images/ult_body_horizontal.png');
		Game.load.image('ult_body_vertical','images/ult_body_vertical.png');
		Game.load.image('ult_origin_right','images/ult_origin_right.png');
		Game.load.image('ult_origin_left','images/ult_origin_left.png');
		Game.load.image('ult_origin_up','images/ult_origin_up.png');
		Game.load.image('ult_origin_down','images/ult_origin_down.png');

		// width, height [, # of frames (of sprite img)]
		Game.load.spritesheet('gold_coin', 'images/gold_coin.png', 32, 32, 8);
		Game.load.spritesheet('copper_coin', 'images/copper_coin.png',35.2,32);
		Game.load.spritesheet('silver_coin', 'images/silver_coin_float.png',32,32);
		Game.load.spritesheet('charging','images/charging.png',80,80);
		Game.load.spritesheet('explode1', 'images/explode1.png', 100, 100, 9);
		Game.load.spritesheet('sship','images/sship.png',50,50);
		Game.load.spritesheet('rship','images/redship.png',50,50);
		Game.load.spritesheet('bship','images/blueship.png',50,50);
		Game.load.spritesheet('pship','images/purpleship.png',50,50);
	},
	
	create: function() {
		Game.state.start('menu');
	}
};