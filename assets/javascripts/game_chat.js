// outgoing message
document.getElementsByClassName('chat-form')[0].addEventListener("submit", function(e) {
e.preventDefault();

var message = document.getElementsByClassName('outgoing-message')[0].value.trim();
	socket.emit('out message', message);

});

socket.on('in message', function(data) {
	//data.message
	//data.alias

});

/* jshint ignore:start */
//////////////////////
// REACT COMPONENTS //
//////////////////////

var Message = React.createClass({
	displayName: 'Message',
	render: function() {
		return (
			<p className='message'>
				{this.props.alias}: {this.props.children}
			</p>
		);
	}
});

var MessageList = React.createClass({
	displayName: "MessageList",
	render: function() {
		return (
			<div className="messageList"></div>
		)
	}
})

var MessageBox = React.createClass({
	displayName: "Messagebox",
	render: function() {
		return (
			React.createElement('div', {id: "message-box"},
				<h3>Messages</h3>
				<MessageList />
				<MessageForm />
			)	
		);
	}
});

var MessageForm = React.createClass({
	displayName: "MessageForm",
	render: function() {
		return (

		)
	}
})

ReactDOM.render(React.createElement(Message, null),
	document.getElementById('messages')
);


/* jshint ignore:end */