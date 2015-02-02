var Hapi = require('Hapi');
var io = require('socket.io');
var config = require('config');
var Id = require('dht-id');

var server = new Hapi.Server(config.get('hapi.options'));

server.connection({
    port: config.get('hapi.port')
});

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
        reply('Signaling Server');
    }
});

server.route({
    method: 'GET',
    path: '/dht',
    handler: function(request, reply) {
        reply(peers);
    }
});

server.start(started);

function started() {
    io.listen(server.listener).on('connection', ioHandler);
    console.log('Signaling server has started on:', server.info.uri);
}

var peers = {};
// id : {
//     socketId:
//     fingerTable: {
//         row : {
//             ideal: <fingerId>
//             current: <fingerId>
//         }
//     }
//     predecessorId
// }

var sockets = {};
// socketId: socket

function ioHandler(socket) {

    // signalling server interactions
    socket.on('s-register', registerPeer);
    socket.on('disconnect', peerRemove); // socket.io own event
    socket.on('s-send-offer', sendOffer);
    socket.on('s-offer-accepted', offerAccepted);

    function registerPeer() {
        var peerId = new Id();
        peers[peerId.toHex()] = {
            socketId:  socket.id,
            fingerTable: {}
        };

        sockets[socket.id] = socket;

        socket.emit('c-registered', {peerId: peerId.toHex()});

        console.log('registered new peer: ', peerId.toHex());

        calculateIdealFingers(peerId);
        updateFingers();
    }

    function calculateIdealFingers(peerId) {
        var fingers = config.get('explorer.fingers');
        var k = 1;
        while (k <= fingers.length) {
            var ideal = (peerId.toDec() + Math.pow(2, fingers[k - 1])) %
                Math.pow(2, 48);
            peers[peerId.toHex()].fingerTable[k] = {
                ideal: new Id(ideal).toHex(),
                current: undefined
            };
            k++;
        }
    }

    function updateFingers() {
        if (Object.keys(peers).length < 2) {
            return;
        }

        var sortedPeersId = Object.keys(peers).sort(function(a, b) {
            var aId = new Id(a);
            var bId = new Id(b);
            if (aId.toDec() > bId.toDec()) {
                return 1;
            }
            if (aId.toDec() < bId.toDec()) {
                return -1;
            }
            if (aId.toDec() === bId.toDec()) {
                console.log('error - There should never two identical ids');
                process.exit(1);
            }
        });

        sortedPeersId.forEach(function(peerId) {

            // predecessor
            var predecessorId = predecessorTo(peerId, sortedPeersId);

            if (peers[peerId].predecessorId !== predecessorId) {
                sockets[peers[peerId].socketId].emit('c-predecessor', {
                    predecessorId: predecessorId
                });

                peers[peerId].predecessorId = predecessorId;
            }

            // sucessors

            Object.keys(peers[peerId].fingerTable).some(function(rowIndex) {
                var fingerId = sucessorTo(peers[peerId]
                                    .fingerTable[rowIndex]
                                    .ideal, sortedPeersId);

                if (peers[peerId].fingerTable[rowIndex].current !==
                    fingerId) {

                    peers[peerId].fingerTable[rowIndex].current = fingerId;

                    sockets[peers[peerId].socketId].emit('c-finger-update', {
                        rowIndex: rowIndex,
                        fingerId: fingerId
                    });
                }

                if (Object.keys(peers).length <
                        config.get('explorer.min-peers')) {
                    return true; // stops the loop, calculates only
                    // for the first position (aka sucessor of the node
                }
            });
        });

        function sucessorTo(pretendedId, sortedIdList) {
            pretendedId = new Id(pretendedId).toDec();
            sortedIdList = sortedIdList.map(function(inHex) {
                return new Id(inHex).toDec();
            });

            var sucessorId;
            sortedIdList.some(function(value, index) {
                if (pretendedId === value) {
                    sucessorId = value;
                    return true;
                }

                if (pretendedId < value) {
                    sucessorId = value;
                    return true;
                }

                if (index + 1 === sortedIdList.length) {

                    sucessorId = sortedIdList[0];
                    return true;
                }
            });

            return new Id(sucessorId).toHex();
        }

        function predecessorTo(peerId, sortedIdList) {
            var index = sortedIdList.indexOf(peerId);

            var predecessorId;

            if (index === 0) {
                predecessorId = sortedIdList[sortedIdList.length - 1];
            } else {
                predecessorId = sortedIdList[index - 1];
            }

            return new Id(predecessorId).toHex();
        }
    }

    function peerRemove() {
        Object.keys(peers).map(function(peerId) {
            if (peers[peerId].socketId === socket.id) {
                delete peers[peerId];
                delete sockets[socket.id];
                console.log('peer with Id: %s has disconnected', peerId);
            }
        });
    }

    // signalling mediation between two peers

    function sendOffer(data) {
        sockets[peers[data.offer.dstId].socketId]
            .emit('c-accept-offer', data);
    }

    function offerAccepted(data) {
        sockets[peers[data.offer.srcId].socketId]
            .emit('c-offer-accepted', data);
    }

}
