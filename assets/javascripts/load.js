var loadState = {
	preload: function() {
		game.load.image('sky','images/sky.jpg');
		game.load.image('bottom_bar', 'images/bottom_bar.png')
		game.load.image('vertical_icon','images/vertical_icon.png')
		game.load.image('shotgun_icon','images/shotgun_icon.png')
		game.load.image('upgrade_icon','images/upgrade_icon.png')
		game.load.image('omni_icon','images/omni_icon.png')
		game.load.image('ult_icon','images/ult_icon.png')
		game.load.image('basic_bullet_right','images/basic_bullet_right.png')
		game.load.image('basic_bullet_down','images/basic_bullet_down.png')
		game.load.image('basic_bullet_left','images/basic_bullet_left.png')
		game.load.image('basic_bullet_up','images/basic_bullet_up.png')
		game.load.image('bubble','images/bubble.png')
		game.load.image('ult_body_horizontal','images/ult_body_horizontal.png')
		game.load.image('ult_body_vertical','images/ult_body_vertical.png')
		game.load.image('ult_origin_right','images/ult_origin_right.png')
		game.load.image('ult_origin_left','images/ult_origin_left.png')
		game.load.image('ult_origin_up','images/ult_origin_up.png')
		game.load.image('ult_origin_down','images/ult_origin_down.png')

		// width, height [, # of frames (of sprite img)]
		game.load.spritesheet('gold_coin', 'images/gold_coin.png', 32, 32, 8)
		game.load.spritesheet('copper_coin', 'images/copper_coin.png',35.2,32)
		game.load.spritesheet('silver_coin', 'images/silver_coin_float.png',32,32)
		game.load.spritesheet('charging','images/charging.png',80,80)
		game.load.spritesheet('explode1', 'images/explode1.png', 100, 100, 9)
		game.load.spritesheet('sship','images/sship.png',50,50)
		game.load.spritesheet('rship','images/redship.png',50,50)
		game.load.spritesheet('bship','images/blueship.png',50,50)
		game.load.spritesheet('pship','images/purpleship.png',50,50)	
	},
	
	create: function() {
		game.state.start('menu')
	}
}