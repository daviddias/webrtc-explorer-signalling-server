var hapi = require('Hapi');
var io   = require('socket.io');

var server = new hapi.Server(9000, { cors: true });
var peerTable = {};


server.route({ 
  method: 'GET', path: '/', 
  handler: function (request, reply) { reply('Signaling Server'); }
});

server.start(hapiStarted);

function hapiStarted() {
  io.listen(server.listener).on('connection', ioConnectionHandler);
  console.log('Signaling Server Started');
}

function ioConnectionHandler(socket) {
  socket.on('s-connect-request',  peerConnectRequest);
  socket.on('s-connect-response', peerConnectResponse);
  
  socket.on('disconnect', function () { // socket.io own event
    console.log('socket disconnect with ID: ', socket.id);      
    delete peerTable[socket.id];
  });

  console.log('New peer connect with socket ID of: ', socket.id);
  peerTable[socket.id] = socket;

  socket.emit('c-connection-established', {peersAvailable: arePeersAvailable()}); 

  function peerConnectRequest (peerInvite) {

    var peersAvailable = arePeersAvailable();
    if (!peersAvailable) {
      return socket.emit('c-connection-response', {peersAvailable: peersAvailable});
    }

    peerInvite.ticket = {
      requester: socket.id,
      solicited: notSamePeer(socket.id)
    };
    
    peerTable[peerInvite.ticket.solicited].emit('c-connection-request', peerInvite);
  }


  function peerConnectResponse (peerInvite) {
    peerTable[peerInvite.ticket.requester].emit('c-connection-response', peerInvite);
  }
}

function arePeersAvailable() {
  if (Object.keys(peerTable).length > 1) {
    return true;
  }
  else {
    return false;
  }
}

function notSamePeer(id) {
  var peerIdList = Object.keys(peerTable);

  for (var i=0; peerIdList.length; i++) {
    if (peerIdList[i] !== id) {
      return peerIdList[i];
    } else {
      continue;
    }
  }
}