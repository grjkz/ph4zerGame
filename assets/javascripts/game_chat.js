// // outgoing message
// document.getElementsByClassName('chat-form')[0].addEventListener("submit", function(e) {
// e.preventDefault();

// var message = document.getElementsByClassName('outgoing-message')[0].value.trim();
// 	socket.emit('out message', message);

// });

// socket.on('in message', function(data) {
// 	//data.message
// 	//data.alias

// });

/* jshint ignore:start */
//////////////////////
// REACT COMPONENTS //
//////////////////////

var Message = React.createClass({
	displayName: 'Message',

	render: function() {
		return (
			<p className='message'>
				{this.props.alias}: {this.props.text}
			</p>
		);
	}
});


var MessageList = React.createClass({
	displayName: "MessageList",
	
	render: function() {
		// create a map of all messages
		var messages = this.props.messages.map(function(message, index) {
			return (
				<Message alias={message.alias} text={message.message} />
			)
		});
		// create one message list which contains all individual messages
		return (
			<div className="messages">
				{messages}
			</div>
		)
	}
})


var MessageBox = React.createClass({
	displayName: "Messagebox",

	getInitialState: function() {
		return {messages: [], users: []}
	},

	componentDidMount: function() {
		console.log("messageBox mounted")
		// push all incoming messages into messages array
		socket.on('in message', function(data) {
			console.log('new msg received')
			console.log(data)
			this.setState(messages.push(data));
		});
		// get all current users
		socket.emit('request usernames');
		socket.on('username list', function(data) {
			this.setState({users: data})
		});
	},

	_handleMessageSubmit: function(comment) {
		socket.emit('out message', comment);
	},

	render: function() {
		return (
			<div id="message-box">
				<h3>Chat:</h3>
				<MessageList messages={this.state.messages} />
				<MessageForm onMessageSubmit={this._handleMessageSubmit} />
			</div>
		);	
	}
});


var MessageForm = React.createClass({
	displayName: "MessageForm",

	getInitialState: function() {
		return {message: ""}
	},

	_updateMessage: function(e) {
		this.setState({message: e.target.value})
	},

	_handleSubmit: function(e) {
		e.preventDefault();
		var message = this.state.message.trim();
		if (message) {
			// invoke _handleMessageSubmit in MessageBox component
			this.props.onMessageSubmit(message);
			e.target.value = "";
		}
	},

	render: function() {
		return (
			<form className="message-form" onSubmit={this._handleSubmit}>
				<input
					type="text"
					className="outgoing-message"
					onChange={this._updateMessage}
					value={this.state.message}
				/>
				<button>Submit</button>
			</form>
		);
	}
})



ReactDOM.render(<MessageBox />, document.getElementById('messages'));


/* jshint ignore:end */