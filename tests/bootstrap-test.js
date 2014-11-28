var Lab = require('lab');
var lab = exports.lab = Lab.script();
var io = require('socket.io-client');
var spawn = require('child_process').spawn;
var uuid = require('webrtc-chord-uuid');
var bigInt = require('big-integer');
var utils = require('./../src/lib/utils');

var experiment = lab.experiment;
var test = lab.test;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

experiment(':', function() {
  var signalingServer;
  var c1;
  var c2;
  var c3;
  var c4;
  var id1;
  var id2;
  var id3;
  var id4;
  var peerTable = {};

  var options = {transports: ['websocket'], 'force new connection': true};
  var socketURL = 'http://localhost:9000';

  before(function(done) {
    signalingServer = spawn('node', ['./src/index.js']);
    signalingServer.stdout.on('data', function(data) {
      // console.log('stdout: \n' + data);
    });
    signalingServer.stderr.on('data', function(data) {
      // console.log('stderr: \n' + data);
    });
    setTimeout(function() { done(); }, 1000);
  });

  after(function(done) {
    c2.disconnect();
    c3.disconnect();
    c4.disconnect();

    setTimeout(function() {
      signalingServer.on('close', function(code) {
        // console.log('cp exited: ' + code);
        done();
      });
      signalingServer.kill();
    }, 500);
  });

  test('connect 4 clients', function(done) {
    var count = 0;

    c1 = io.connect(socketURL, options);
    c2 = io.connect(socketURL, options);
    c3 = io.connect(socketURL, options);
    c4 = io.connect(socketURL, options);
    c1.on('connect', connected);
    c2.on('connect', connected);
    c3.on('connect', connected);
    c4.on('connect', connected);

    function connected() {
      count += 1;
      if (count === 4) {
        done();
      }
    }

  });

  test('register 2 clients', function(done) {
    id1 = uuid.gen();
    id2 = uuid.gen();
    expect(id1).to.not.equal(id2);

    c1.emit('s-id', id1);
    c2.emit('s-id', id2);
    setTimeout(done, 500);
  });

  test('boot 2 nodes', function(done) {
    var count = 0;

    var offer1 = {
      srcId: id1,
      destId: idPlusOne(id1),
      signal: 'fromPeer1'
    };

    var offer2 = {
      srcId: id2,
      destId: idPlusOne(id2),
      signal: 'fromPeer2'
    };

    c1.once('c-accept-offer', function(offer) {
      expect(offer).to.deep.equal(offer2);
      offer.destId = id1;
      c1.emit('s-offer-accepted', offer);
    });

    c2.once('c-accept-offer', function(offer) {
      expect(offer).to.deep.equal(offer1);
      offer.destId = id2;
      c2.emit('s-offer-accepted', offer);
    });

    c1.once('c-offer-accepted', function(offer) {
      expect(offer.destId).to.equal(id2);

      count += 1;
      if (count === 2) {
        count += 1; // to fire done only once
        done();
      }
    });

    c2.once('c-offer-accepted', function(offer) {
      expect(offer.destId).to.equal(id1);

      count += 1;
      if (count === 2) {
        count += 1; // to fire done only once
        done();
      }
    });

    c1.emit('s-send-offer', offer1);
    c2.emit('s-send-offer', offer2);

  });

  test('boot a third node', {timeout: 10 * 1000}, function(done) {
    id3 = uuid.gen();

    var offer3 = {
      srcId: id3,
      destId: idPlusOne(id3),
      signal: 'fromPeer3'
    };

    peerTable[id1] = c1;
    peerTable[id2] = c2;
    peerTable[id3] = c3;
    var sorted = utils.sortPeerTable(peerTable);
    var sucessorOfId3 = utils.sucessorToId(idPlusOne(id3), sorted);
    var predecessoOfId3 = utils.predecessorToId(id3, sorted);

    peerTable[sucessorOfId3].once('c-accept-offer', function(offer) {
      expect(offer).to.deep.equal(offer3);
      offer.destId = sucessorOfId3;
      peerTable[sucessorOfId3].emit('s-offer-accepted', offer);
    });

    c3.once('c-offer-accepted', function(offer) {
      expect(offer.destId).to.equal(sucessorOfId3);
      setTimeout(done, 500);
    });

    peerTable[predecessoOfId3].once('c-new-sucessor-available', function(id) {
      expect(id).to.equal(id3);
    });

    c3.emit('s-id', id3);
    setTimeout(function() {
      c3.emit('s-send-offer', offer3);
    }, 500);

  });

  test('kill first node', function(done) {
    c1.disconnect();
    delete peerTable[id1];

    done();
  });

  test('connect fourth node', {timeout: 10 * 1000}, function(done) {
    id4 = uuid.gen();

    var offer4 = {
      srcId: id4,
      destId: idPlusOne(id4),
      signal: 'fromPeer4'
    };

    peerTable.id4 = c4;
    var sorted = utils.sortPeerTable(peerTable);
    var sucessorOfId4 = utils.sucessorToId(idPlusOne(id3), sorted);
    var predecessoOfId4 = utils.predecessorToId(id4, sorted);

    peerTable[sucessorOfId4].once('c-accept-offer', function(offer) {
      expect(offer).to.deep.equal(offer4);
      offer.destId = sucessorOfId4;
      peerTable[sucessorOfId4].emit('s-offer-accepted', offer);
    });

    c4.once('c-offer-accepted', function(offer) {
      expect(offer.destId).to.equal(sucessorOfId4);
      setTimeout(done, 500);
    });

    peerTable[predecessoOfId4].once('c-new-sucessor-available', function(id) {
      expect(id).to.equal(id4);
    });

    c4.emit('s-id', id4);
    c4.emit('s-send-offer', offer4);

    done();
  });

  function idPlusOne(id) {
    return (bigInt(id, 16).add(1)).toString(16);
  }

});
