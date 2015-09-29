var express = require('express')
var app = express()
// var server = require('http').Server(app)
var ejs = require('ejs')

var server = app.listen(3001,function() {
	console.log('server is listening on 3001')
})
var io = require('socket.io')(server);

app.set('view_engine', 'ejs')
app.use(express.static('assets'))

app.get('/', function(req,res) {
	res.render('index.ejs')
})

// server http
app.get('/game',function(req,res) {
	res.render('game.ejs')
})

app.get('/game/full',function(req,res) {
  res.render('fullerror.ejs')
})

app.get('*',function(req,res) {
	res.redirect('/game')
})


// server socket
var Users = {}
// var userCounter = 0
var bulletCounter = 0;
var coinCounter = 0;
var shieldCounter = 0;
var spots = {
  1: {
    x: 100,
    y: 100,
    taken: false,
    ship: 'sship',
    facing: 'right'
  },
  2: {
    x: 1180,
    y: 500,
    taken: false,
    ship: 'bship',
    facing: 'left'
  },
  3: {
    x: 100,
    y: 500,
    taken: false,
    ship: 'rship',
    facing: 'right'
  },
  4: {
    x: 1180,
    y: 100,
    taken: false,
    ship: 'pship',
    facing: 'left'
  }
}


io.on('connection', function(client){
  // get rid of user if game is full
  var userCounter = 0;
  for (user in Users) {
    userCounter++
  }
  if (userCounter >= 4) {
    client.emit('redirect full')
  } 

  // try to create game states
  // dont start he game until all players have clicked on the start menu's "ready button"
  // restrict any new players from joining the game when the game has started. 
  // find a way to put 4 players into a channel
  // limit the number of players to 4 for now for testing purposes

  // userCounter++
  // console.log(userCounter+" user(s) connected (joined)")

  // wait for client to tell server that it's ready before sending over data
  client.on('ready', function() {
    // sends the new client all previous existing Users
    client.emit('get other players', Users)
    
    // create new player object with location
    generatePlayer(spots, client.id);

  for (user in Users) {
    console.log(user)
  }
		// send new user his own info
		client.emit('player info', Users[client.id])
		// send new user to all other clients
		client.broadcast.emit('add new user', Users[client.id])
		// tell the chat room that a user has connected
		io.emit('connected msg', client.id)
	})

  // user disconnects
  client.on('disconnect', function(){
    if (userCounter < 4) {
      // console.log("id: "+client.id+"|| spot: "+Users[client.id].spot)
      spots[Users[client.id].spot].taken = false
      // console.log(client.id+" disconnected");
      io.emit('delete player', client.id)
      // userCounter--
      // console.log(userCounter+" user(s) left (disconnected)")
      for (user in Users) {
        if (user === client.id) {
          delete Users[client.id]
          console.log('deleted '+user)
        }
        // console.log(user+" is still logged in")
      }
    }
  });

  // player dies
  client.on('player died', function() {
    Users[client.id].defeated = true
    client.emit('redirect')
  })

  // player is last man standing
  client.on('player wins', function() {
    client.emit('redirect win')
    for (user in Users) {
      console.log('deleting '+user)
      delete Users[user]
    }
  })

  // user position update (constantly updating)
  // not persisted on server
  client.on('movement', function(position) {
  	client.broadcast.emit('movement', {
  		id: client.id, 
  		x: position.x, 
  		y: position.y, 
  		facing: position.facing
  	})
  })

  // user fires
  client.on('shoot', function(data) {
		io.emit('shoots fired', {
			id: data.id,
			facing: data.facing,
			bulletID: bulletCounter
		})
		bulletCounter++
	})

  // user gets hit
  client.on('im hit', function(data) {
  	client.broadcast.emit('player hit', data)
  })

  // randomly generate coins
  // an instance of this is created upon each player connection resulting in too many coins
  setInterval(function() {
  	io.emit('spawn coin', generateCoin())
  },Math.floor(Math.random()*10000)+10000)

  // user picked up coin
  client.on('coin get', function(coin) {
  	Users[this.id].bank += coin.value
  	// send over userID and their new bank amount
  	io.emit('update bank', {
  		id: this.id, 
  		bank: Users[this.id].bank,
  		coinID: coin.coinID
  	})
  })

  // user requests gun upgrade
  client.on('upgrade gun', function() {
  	if (Users[client.id].bank >= 500) {
  		Users[client.id].bank -= 500
	  	io.emit('upgrade receipt', {id: client.id, bank: Users[client.id].bank, passed: true})
  	}
  	else {
  		client.emit('upgrade receipt', {passed: false})	
  	}
  })

  // user requests a shield
  client.on('buy shield', function() {
  	if (Users[client.id].bank >= 350) {
  		Users[client.id].bank -= 350;
  		io.emit('shield receipt', {id: client.id, bank: Users[client.id].bank,shieldID: shieldCounter, passed: true})
  		shieldCounter++
  	}
  	else {
  		client.emit('shield receipt', {passed: false})		
  	}
  })

  // user requests shotgun shot
  client.on('buy shotgun', function() {
  	if (Users[client.id].bank >= 250) {
  		Users[client.id].bank -= 250;
  		var firstID = bulletCounter
  		bulletCounter++
  		var secondID = bulletCounter
  		bulletCounter++
  		var thirdID = bulletCounter
  		io.emit('shotgun receipt', {id: client.id, bank: Users[client.id].bank,bulletID1: firstID, bulletID2: secondID, bulletID3: thirdID, passed: true})
  		bulletCounter++
  	}
  	else {
  		client.emit('shotgun receipt', {passed: false})
  	}
  })

  // user requests vertical shot
  client.on('buy vertical', function() {
  	if (Users[client.id].bank >= 150) {
  		Users[client.id].bank -= 150;
  		var firstID = bulletCounter
  		bulletCounter++
  		var secondID = bulletCounter
  		io.emit('vertical receipt', {id: client.id, bank: Users[client.id].bank,bulletID1: firstID, bulletID2: secondID, passed: true})
  		bulletCounter++
  	}
  	else {
  		client.emit('vertical receipt', {passed: false})
  	}
  })

  // user requests 8-way directional shot
  client.on('buy omnishot', function() {
  	if (Users[client.id].bank >= 500) {
  		Users[client.id].bank -= 500;
  		var ids = []
  		for (var i = 0; i<8; i++) {
  			ids.push(i)
  		}
  		io.emit('omnishot receipt', {id: client.id, bank: Users[client.id].bank,bulletID: ids, passed: true})
  	}
  	else {
  		client.emit('omnishot receipt', {passed: false})
  	}
  })

  // user requests ultimate
  client.on('buy ultimate', function() {
  	if (Users[client.id].bank >= 3000) {
  		Users[client.id].bank -= 3000;
  		io.emit('ultimate receipt', {id: client.id, bank: Users[client.id].bank,bulletID: bulletCounter, passed: true})
  		bulletCounter++
  	}
  	else {
  		client.emit('ultimate receipt', {passed: false})	
  	}
  })


  // messaging
  client.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});



var generatePlayer = function(spots, id) {
	var observer = false
  console.log(spots)
  for (spot in spots) {
    if (!spots[spot].taken) {
      //    var x = spots[spot].x
      //    var y = spots[spot].y
      // var facing = spots[spot].facing
      //    var ship = spots[spot].ship
      spots[spot].taken = true
      Users[id] = {
        id: id,
        bank: 0,
        alias: "Unknown",
        x: spots[spot].x, 
        y: spots[spot].y,
        facing: spots[spot].facing,
      //  ALSO SEND OVER THE SHIP SPRITESHEET NAME THEY ARE SUPPOSED TO RENDER
        ship: spots[spot].ship,
        defeated: false,
        spot: spot,
        observer: observer
  		}
      break
    }
  }
  // if (userCounter === 1) {
  //     var x = spots[1].x
  //     var y = spots[1].y
  //     var facing = "right"
  //     var ship = 'sship'
    // }
    // else if (userCounter ===2) {
    //  var x = 1180
    //  var y = 500
    //  var facing = "left"
  //     var ship = 'bship'
    // }
    // else if (userCounter ===3) {
    //  var x = 100
    //  var y = 500
    //  var facing = "right"
  //     var ship = 'rship'
    // }
    // else if (userCounter ===4) {
    //  var x = 1180
    //  var y = 100
    //  var facing = "left"
  //     var ship = 'pship'
    // }
    // else {
    //  var x = Math.floor(Math.random()*1230)
    //  var y = Math.floor(Math.random()*550)
    //  observer = true
    // }
}

generateCoin = function() {
	var name = ''
	var timer = 0
	var value = 0
	var randomNum = Math.floor(Math.random()*100)
	if (randomNum < 13) {
		name = "gold_coin"
		timer = Math.floor(Math.random() * 10000)+5000
		value = 500
	}
	else if (randomNum < 50) {
		name = "silver_coin"
		timer = Math.floor(Math.random() * 10000)+10000
		value = 200
	}
	else {
		name = "copper_coin"
		timer = Math.floor(Math.random() * 10000)+10000
		value = 50
	}

	coin = {
		x: Math.floor(Math.random()*(1280-32)),
		y: Math.floor(Math.random()*(600-32)),
		type: name,
		value: value,
		coinID: coinCounter,
		expire: timer
	}
	coinCounter++

	return coin
}


