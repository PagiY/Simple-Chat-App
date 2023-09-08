$(document).ready(function(){
  const socket = io();

  promptUser(socket);

  $('form').on('submit', function(e){
    e.preventDefault();

    let sendTo = $('#select-users').find(":selected").val();
    let msg = $('form :input[type="text"]').val();

    socket.emit('sendChat', {to: sendTo, msg : msg});
  });

  $(document).on('click', 'button',function(e){
    socket.emit('kick', {user: e.target.id});
  })

    
  /*=================== JOIN SOCKETS =======================*/
  socket.on('onJoinNotifySelf', function(data){
    updateSelfAsParticipant(data);
  })

    
  socket.on('onJoinNotifyAllExceptSelf', function(data){
    updateParticipants(data); 
    updateUserMessages(data);   
  })

  socket.on('onJoinNotifyAll', function(data){
    updateChat(data);
    $('#container').css("display", "block");
  });

  /*==================== CHAT SOCKETS =======================*/
  socket.on('onChatNotifyUser', function(data){
    updateChat(data);
  })

  socket.on('onChatNotifySelf', function(data){
    updateChat(data);
  })

  socket.on('onChatNotifyAll', function(data){
    updateChat(data);
  })

  /*==================== KICK SOCKETS =================*/
  socket.on('onKickNotifyUser', function(){
    $('#container').text("Sorry, You have been kicked :(");
  })

  /*==================== DISCONNECT SOCKETS =================*/
  socket.on('onLeaveNotifyAll', function(data){
    updateChat(data);

    $(`#${data.user.socketID}`).remove();    
    $('#select-users option[value = '+data.user.socketID+']').remove();
  })

  socket.on('newAdminNotifyAll', function(data){
    updateChat(data);
    updateNewAdmin(data);
  })
})


function promptUser(socket, msg = ""){
  let newUser = prompt(msg+"What is your name?");

  if(newUser === "" || newUser === null){
    promptUser(socket, "No empty names. ");
  }
  else{
    socket.emit("addUser", {user: newUser});
  }

}

function updateParticipants(data){

  let newLi = $("<li></li>");

  let newBtn = $("<button></button>");

  if(data.user.admin == true){
    newBtn.text("[Admin] "+data.user.username);
    newBtn.attr('class', 'admin');
  }
  else{
    newBtn.text(data.user.username);
    newBtn.attr('class', 'participant');
  }

  newBtn.attr('class', 'list-group-item list-group-item-action');
  newBtn.attr('id', data.user.socketID);
  newLi.append(newBtn);
  $('ul').append(newLi);

}

function updateSelfAsParticipant(data){

  $('.self').text(`${data.user.username}`);

  if(data.user.admin == true){
    $('.self').removeClass("participant");
    $('.self').addClass("admin");
    $('.self').prepend(`<span class="badge bg-danger">You</span>`);
    $('.self').prepend(`<span class="badge bg-primary">Admin</span>`);
  }
  else{
    $('.self').prepend(`<span class="badge bg-danger">You</span>`);
  }
  $('.self').attr('id', data.user.socketID);
}

function updateUserMessages(data){
  let newOption = $('<option value = "'+data.user.socketID+'"></option>').text(data.user.username);
  $('#select-users').append(newOption);
}

function updateChat(data){

  let newDiv = $("<div class = 'chat'></div>");

  if(data.type == "msg"){
    let newRecipient = $("<p class = 'recipients'></p>").text(data.from+" to "+data.to+":");
    newDiv.append(newRecipient);
  }

  let newChat = $("<p class = 'message "+data.type+"'></p>").text(data.msg);
    
  newDiv.append(newChat);

  $('#chats').append(newDiv);

}

function updateNewAdmin(data){
  $(`#${data.user.socketID}`).removeClass('participant');
  $(`#${data.user.socketID}`).addClass('admin');
  $(`#${data.user.socketID}`).prepend(`<span class="badge bg-primary">Admin</span>`);
}