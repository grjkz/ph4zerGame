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


// server http
app.get('/game',function(req,res) {
	res.render('game.ejs')
})

app.get('*',function(req,res) {
	console.log('redirecting to /game')
	res.redirect('/game')
})


// server socket
var users = { counter: 0 }
var bulletCounter = 0
var coinCounter = 0

io.on('connection', function(client){
  // console.log('a user connected');
  users.counter++
  console.log(users.counter+" user(s) connected")

  // wait for client to tell server that it's ready before sending over data
	client.on('ready', function() {
		// sends the new client all previous existing users
		client.emit('get other players', users)
		
		// create new player object with location
		generatePlayer(client.id);

		// send new user his own info
		client.emit('player info', users[client.id])
		// send new user to all other clients
		client.broadcast.emit('add new user', users[client.id])
		// tell the chat room that a user has connected
		io.emit('connected msg', client.id)
	})

  // user disconnects
  client.on('disconnect', function(){
    console.log(client.id+" disconnected");
    io.emit('delete player', client.id)
    delete users[client.id]
    users.counter--
    console.log(users.counter+" user(s) left")
  });


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
  	users[this.id].bank += coin.value
  	// send over userID and their new bank amount
  	io.emit('update bank', {
  		id: this.id, 
  		bank: users[this.id].bank,
  		coinID: coin.coinID
  	})
  })




  client.on('chat message', function(msg){
  	if (msg === "ready") {
  		client.emit('player info', users[client.id])
  		console.log('ready was typed')
  	}
	// console.log("***********************************************************")
	// console.log(users[client.id])
    // console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  client.on('name change', function(name) {
  	console.log('name change involked!!!!')
  })

});




// var findPlayer = function(id) {
// 	users.forEach(function(user) {
// 		if (user.id == id) return user
// 	})
// }

generatePlayer = function(id) {
	var observer = false
	if (users.counter === 1) {
			var x = 100
			var y = 100
			var facing = "right"
		}
		else if (users.counter ===2) {
			var x = 1180
			var y = 500
			var facing = "left"
		}
		else if (users.counter ===3) {
			var x = 100
			var y = 500
			var facing = "right"
		}
		else if (users.counter ===4) {
			var x = 1180
			var y = 100
			var facing = "left"
		}
		else {
			var x = Math.floor(Math.random()*1230)
			var y = Math.floor(Math.random()*550)
			observer = true
		}

		users[id] = {
			id: id,
			bank: 0,
			alias: "Unknown",
			x: x, 
			y: y,
			facing: facing,
			observer: observer
		}
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












