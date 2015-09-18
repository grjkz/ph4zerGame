var express = require('express')
var app = express()
// var server = require('http').Server(app)
var ejs = require('ejs')
var Player = require('./assets/javascripts/models/Player').Player

var server = app.listen(3000,function() {
	console.log('server is listening on 3k')
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

io.on('connection', function(client){
  console.log('a user connected');
  users.counter++

  // wait for client to tell server that it's ready before sending over data
	client.on('ready', function() {
		// sends the new client all previous existing users
		client.emit('get other players', users)
		
		// var newUser = new Player(client.id)
		if (users.counter === 1) {
			var x = 100
			var y = 100
		}
		else if (users.counter ===2) {
			var x = 1180
			var y = 500
		}
		else if (users.counter ===3) {
			var x = 100
			var y = 500
		}
		else if (users.counter ===4) {
			var x = 1180
			var y = 100
		}

		users[client.id] = {
			id: client.id,
			bank: 0,
			alias: "Unknown",
			x: x, 
			y: y
		}

		// console.log(users)
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

  // user fires
  client.on('shoot', function(msg) {
		io.emit('shoot', msg)
	})

  // user moves
  // not persisted on server
  client.on('movement', function(location) {
  	// console.log(location)
  	client.broadcast.emit('movement', {id: this.id, x: location.x, y: location.y})

  })

  // user picks up coin
  client.on('add coin', function(coin) {
  	console.log(this.id)
  	var player = users[this.id]
  	console.log("player bank was: "+player.bank)
  	player.bank += coin
  	console.log('player bank is now: '+player.bank)
  	io.emit('update bank', player)
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

});




// var findPlayer = function(id) {
// 	users.forEach(function(user) {
// 		if (user.id == id) return user
// 	})
// }
















