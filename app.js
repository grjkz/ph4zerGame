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


  // user moves
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
		io.emit('shoot', {
			id: data.id,
			facing: data.facing,
			bulletID: bulletCounter
		})

		bulletCounter++
	})

  // user gets hit
  client.on('player hit', function(data) {
  	client.broadcast.emit('player hit', data)
  })

  // user picks up coin
  client.on('add coin', function(coin) {

  	// var player = users[this.id]
  	// console.log(player.id+" bank was: "+player.bank)

  	users[this.id].bank += coin

  	// console.log(player.id+' bank is now: '+player.bank)

  	// send over userID and their new bank amount
  	client.broadcast.emit('update bank', {id: this.id, bank: users[this.id].bank})
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
		}

		users[id] = {
			id: id,
			bank: 0,
			alias: "Unknown",
			x: x, 
			y: y,
			facing: facing
		}
}














