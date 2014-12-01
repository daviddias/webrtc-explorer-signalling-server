var hapi = require('Hapi');
var io = require('socket.io');
var bigInt = require('big-integer');
var utils = require('./lib/utils');

var port = parseInt(process.env.PORT) || 9000;
var server = new hapi.Server(port, {cors: true});
var socketIdpeerId = {};
var peerTable = {};

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply('Signaling Server');
  }
});

server.start(hapiStarted);

function hapiStarted() {
  io.listen(server.listener).on('connection', ioConnectionHandler);
  // console.log('Signaling server has started on:', server.info.uri);
}

function ioConnectionHandler(socket) {

  socket.on('s-id', registerPeer);
  socket.on('s-send-offer', sendOffer);
  socket.on('s-offer-accepted', offerAccepted);
  socket.on('disconnect', peerRemove); // socket.io own event

  function registerPeer(id) {
    // console.log('Registering peer with Id: ', id);
    peerTable[id] = {
      socket: socket
    };
    socketIdpeerId[socket.id] = id;
    // console.log('peerTable: ', Object.keys(peerTable));

    if (Object.keys(peerTable).length > 2) {
      // warn a peer of new sucessor
      var sorted = utils.sortPeerTable(peerTable);
      var predecessorToId = utils.predecessorToId(id, sorted);
      peerTable[predecessorToId]
        .socket.emit('c-new-sucessor-available', id);
    }
  }

  function sendOffer(offer) {
    // console.log('sendOffer');
    function twoOrMore() {
      if (Object.keys(peerTable).length < 2) {
        // console.log('--peerTable: ', Object.keys(peerTable));
        return setTimeout(twoOrMore, 1000);
      }

      // console.log('sendOffer - flag');
      var sorted = utils.sortPeerTable(peerTable);

      peerTable[utils.sucessorToId(offer.destId, sorted)]
        .socket.emit('c-accept-offer', offer);
    }
    twoOrMore();
  }

  function offerAccepted(offer) {
    // console.log('offerAccepted');
    peerTable[offer.srcId].socket.emit('c-offer-accepted', offer);
  }

  function peerRemove() {
    // console.log('peer disconnected: ', socketIdpeerId[socket.id]);
    delete peerTable[socketIdpeerId[socket.id]];
    delete socketIdpeerId[socket.id];
  }
}
