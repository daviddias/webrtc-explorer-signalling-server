var hapi = require('Hapi');
var io   = require('socket.io');
var bigInt = require('big-integer');

var server = new hapi.Server(parseInt(process.env.PORT) || 9000, { cors: true });
var booted = false;
var socketId_peerId = {};
var peerTable = {}; 
// { 
//   peerId: { 
//     socket: socket,
//     invite: {
//        peerId: <this peerId>
//        signalData: {
//          predecessor: '<signaldata>',
//          sucessor: '<signaldata>'
//        }
//     },
//     inviteReply: {
//        peerId: <this peerId>,
//        signalData: {
//          predecessor: '<signaldata>',
//          sucessor: '<signaldata>'
//        }
//   },
//   ...
// } 

server.route({ 
  method: 'GET', path: '/', 
  handler: function (request, reply) { reply('Signaling Server'); }
});

server.start(hapiStarted);

function hapiStarted() {
  io.listen(server.listener).on('connection', ioConnectionHandler);
  console.log('Signaling server has started on:', server.info.uri);
}

function ioConnectionHandler(socket) {
  // console.log('New peer connect with {socketId: %s}', socket.id);

  socket.on('s-join',  peerJoin);
  socket.on('s-join-next',  peerJoinNext); // for warmup
  socket.on('s-response', peerJoinResponse); // for normal mode
  socket.on('disconnect', peerRemove); // socket.io own event

  function peerJoin (invite) {
    console.log('peer { peerId: %s } is requesting to join the network', invite.peerId);

    if (!bootstrap(invite, socket)) { return; }

    /// do normal join process
    addPeerToTable(invite, socket);

    var p_s = predecessorAndSucessor(invite.peerId);
    // peer with peerId will be the sucessor of the node with predecessorId and vice versa
    peerTable[p_s.predecessorId].socket.emit('c-sucessor', invite);
    peerTable[p_s.sucessorId].socket.emit('c-predecessor', invite);
  }

  /// boostrap

  function bootstrap(invite, socket) {
    if (booted) { console.log('the chord has been booted'); return true; }

    if (Object.keys(peerTable).length < 5) { addPeerToTable(invite, socket); } 

    var peerIds = Object.keys(peerTable);
    // console.log('We now have %d', peerIds.length);

    if (peerIds.length >= 5) {
      var sortedPeerTable = sortPeerTable();
      peerIds.map(function (peerId) {   
        var p_s = predecessorAndSucessor(peerId, sortedPeerTable);

        var predecessorInvite = {
          peerId: peerId,
          signalData: peerTable[peerId].invite.signalData.sucessor 
        };
        
        peerTable[p_s.sucessorId].socket.emit('c-warmup-predecessor', predecessorInvite);
      });
      booted = true;
    } 
    return false; // to not do the normal process
  }

  function peerJoinNext(sucessorInvite) {
    peerTable[sucessorInvite.returnTo].socket.emit('c-warmup-sucessor', sucessorInvite);
  }



  /// Normal Response Process

  function peerJoinResponse (inviteReply) {
    if (inviteReply.signalData.predecessor) {
      console.log('received predecessor data for peer { peerId: %s }', inviteReply.peerId);
      console.log('PEERS AVAILABLE: ', Object.keys(peerTable));

      console.log('OBJECT', peerTable[inviteReply.peerId]);
      peerTable[inviteReply.peerId].inviteReply.signalData.predecessor = inviteReply.signalData.predecessor;
    }

    if (inviteReply.signalData.sucessor) {
      console.log('received sucessor data for peer { peerId: %s }', inviteReply.peerId);     
      console.log('PEERS AVAILABLE: ', Object.keys(peerTable));

      console.log('OBJECT', peerTable[inviteReply.peerId]);


      peerTable[inviteReply.peerId].inviteReply.signalData.sucessor = inviteReply.signalData.sucessor;
    }

    // if we have both responses from sucessor and predecessor, send to peer who iniatiated
    if (peerTable[inviteReply.peerId].inviteReply.signalData.predecessor && peerTable[inviteReply.peerId].inviteReply.signalData.sucessor) {
      console.log('Sending c-response to peer with id:', inviteReply.peerId);
      peerTable[inviteReply.peerId].socket.emit('c-response', peerTable[inviteReply.peerId].inviteReply);
    }
  }

  function peerRemove() { 
    // console.log('peer disconnect with socketID: %s and peerId: %s ', socket.id, socketId_peerId[socket.id]);      
    delete peerTable[socketId_peerId[socket.id]];
    delete socketId_peerId[socket.id];
  }
}



function predecessorAndSucessor (peerId, sortedPeerTable) {
  var s = sortedPeerTable || sortPeerTable();
  var r = {};
  var done = false;

  s.forEach(function (value, index) {
    if (value === peerId && !done) {
      done = true;
      if(index === 0) {
        r.predecessorId = s[s.length-1];
        r.sucessorId = s[index+1];
        return;
      }
      if(index === s.length-1){
        r.predecessorId = s[index-1];
        r.sucessorId = s[0];
        return;
      }
      r.predecessorId = s[index-1];
      r.sucessorId = s[index+1];
    }
  });
  return r;
}

function sortPeerTable() {
  var sorted = Object
                .keys(peerTable)
                .sort(function(a, b) {
                  var aBig = bigInt(a, 16);
                  var bBig = bigInt(b, 16); 
                  if (aBig.lesser(bBig)) { 
                    return -1; 
                  }
                  if (aBig.greater(bBig)) {
                    return 1; 
                  }
                  return 0;
                });
                // .map(function(key){
                //   return peerTable[key];
                // });         
  return sorted;
}

function addPeerToTable(invite, socket) {
  peerTable[invite.peerId] = {
    socket: socket,
    invite: invite,
    inviteReply: {
      signalData: {}
    }
  };
  socketId_peerId[socket.id] = invite.peerId;
}