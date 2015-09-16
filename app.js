var express = require('express')
var app = express();
var ejs = require('ejs')
app.set('view_engine', 'ejs')
app.use(express.static('assets'))


app.listen('3000',function() {
	console.log('server is listening on 3k')
})


app.get('/game',function(req,res) {
	res.render('game.ejs')
})

app.get('*',function(req,res) {
	console.log('redirecting to /game')
	res.redirect('/game')
})