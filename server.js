const express = require('express');
const app = express();

app.use(express.static(__dirname+"/static"));
app.set("views", __dirname+"\\views");
app.set("view engine", "ejs");

const server = app.listen(8001, () => {
	console.log("Listening to PORT 8001");
})

const io = require('socket.io')(server);

let users = [];

app.get('/', function(req, res){
	res.render("index", {users:users});
})

io.on('connection', function(socket){
	
	socket.on('addUser', function(data){
			
		let admin = false;

		// sets the first user as the admin
		if(users.length === 0){
				admin = true;
		}

		let newUser = {
				socketID : socket.id,
				username : data.user,
				admin
		}
		
		users.push(newUser);

		socket.emit('onJoinNotifySelf', {user: newUser});
		
		let dataToEmit = {
			user: newUser,
			type: "join",
			msg: `${newUser.username} just joined!`
		}

		socket.broadcast.emit('onJoinNotifyAllExceptSelf', {
			...dataToEmit,
			users,
		});

		io.emit('onJoinNotifyAll', dataToEmit);

	});

	socket.on('sendChat', function(data){

		let from = users.filter(user => user.socketID === socket.id);

		if(data.to !== "everyone"){
			let to = users.filter(user => user.socketID === data.to);

			io.to(data.to).emit('onChatNotifyUser', {to : "You", from: from[0].username, msg: data.msg, type:"msg"});
			socket.emit('onChatNotifySelf', {to : to[0].username, from: "You", msg: data.msg, type:"msg"});
		}
		else{
				io.emit('onChatNotifyAll', {to : "Everyone", from: from[0].username, msg: data.msg, type:"msg"})
		}
			
	})

	socket.on('kick', function(data){
		let thisUser = users.find(user => user.socketID == socket.id);
		
		if(thisUser.admin === true){
				
			io.sockets.sockets.forEach((socketToKick) => {
					
				if(socketToKick.id === data.user){

					let user = users.find(user => user.socketID == socketToKick.id);
					
					io.to(socketToKick.id).emit('onKickNotifyUser', {});

					io.emit('onChatNotifyAll', { type:"kick", msg: `${user.username} has been kicked!` });
					
					socketToKick.disconnect(true);

				}
							
			}); 
		}
			
	})

	socket.on('disconnect', function(){

		let user = users.find(user => user.socketID === socket.id);

		if(user !== undefined){

			users = users.filter(user => user.socketID !== socket.id);

			io.emit('onLeaveNotifyAll', { user, type: "left", msg: `${user.username} just left...` });

			if(user.admin == true){

				if(users.length !== 0){

					users[0].admin = true;

					socket.broadcast.emit('newAdminNotifyAll', {
						user: users[0],
						type: "join",
						msg: `${users[0].username} is appointed new admin!`
					});

				}
			}
		}

	})

})