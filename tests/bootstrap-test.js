var Lab = require('lab');
var lab = exports.lab = Lab.script();
var io = require('socket.io-client');
var spawn = require('child_process').spawn;
var git_sha1 = require('git-sha1');

var experiment = lab.experiment;
var test = lab.test;
// var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

experiment(':', function () {
  var signalingServer;
  var c1, c2, c3, c4, c5;
  var peer1Id, peer2Id, peer3Id, peer4Id, peer5Id;

  var options = { transports: ['websocket'], 'force new connection': true };
  var socketURL = 'http://localhost:9000';

  before(function (done) {
    signalingServer = spawn('node', ['./index.js']);
    signalingServer.stdout.on('data', function (data) {  /* console.log('stdout: ' + data); */ });
    signalingServer.stderr.on('data', function (data) {  /* console.log('stderr: ' + data); */ });
    setTimeout(function () { done(); }, 1000);
  });

  after(function (done) {
    c1.disconnect();
    c2.disconnect();
    c3.disconnect();
    c4.disconnect();
    c5.disconnect();

    setTimeout(function () { 
      signalingServer.on('close', function (code) { 
        /* console.log('cp exited: ' + code); */
        done();
      });

      signalingServer.kill(); 
    }, 1500);
  });

  test('connect the first client', function (done) {
    c1 = io.connect(socketURL, options);
    c1.on('connect', function() { done(); });
  });

  test('connect the second client', function (done) {
    c2 = io.connect(socketURL, options);
    c2.on('connect', function() { done(); });
  });

  test('connect the third client', function (done) {
    c3 = io.connect(socketURL, options);
    c3.on('connect', function() { done(); });
  });

  test('connect the fourth client', function (done) {
    c4 = io.connect(socketURL, options);
    c4.on('connect', function() { done(); });
  });

  test('connect the fifth client', function (done) {
    c5 = io.connect(socketURL, options);
    c5.on('connect', function() { done(); });
  });


  test('first of 5 clients joins', function (done) {
    peer1Id = idGen();
    c1.emit('s-join', { peerId: peer1Id, signalData: { predecessor: '1-P', sucessor: '1-S' }});
    done();
  });

  test('second of 5 clients joins', function (done) {
    peer2Id = idGen();
    c2.emit('s-join', { peerId: peer2Id, signalData: { predecessor: '2-P', sucessor: '2-S' }});
    done();
  });

  test('third of 5 clients joins', function (done) {
    peer3Id = idGen();
    c3.emit('s-join', { peerId: peer3Id, signalData: { predecessor: '3-P', sucessor: '3-S' }});
    done();
  });

  test('fourth of 5 clients joins', function (done) {
    peer4Id = idGen();
    c4.emit('s-join', { peerId: peer4Id, signalData: { predecessor: '4-P', sucessor: '4-S'}});
    done();
  });  

  test('last of 5 clients join and network gets bootstrapped', {timeout: 1 * 60 * 1000},function (done) {
    var responseArr = [];
    var count = 0;

    c1.on('c-warmup-predecessor', function (invite) {
      c1.emit('s-join-next', {returnTo: invite.peerId});
    });

    c2.on('c-warmup-predecessor', function (invite) {
      c2.emit('s-join-next', {returnTo: invite.peerId});
    });

    c3.on('c-warmup-predecessor', function (invite) {
      c3.emit('s-join-next', {returnTo: invite.peerId});
    });

    c4.on('c-warmup-predecessor', function (invite) {
      c4.emit('s-join-next', {returnTo: invite.peerId});
    });

    c5.on('c-warmup-predecessor', function (invite) {
      c5.emit('s-join-next', {returnTo: invite.peerId});
    });

    c1.on('c-warmup-sucessor', function (invite){ count += 1; });
    c2.on('c-warmup-sucessor', function (invite){ count += 1; });
    c3.on('c-warmup-sucessor', function (invite){ count += 1; });
    c4.on('c-warmup-sucessor', function (invite){ count += 1; });
    c5.on('c-warmup-sucessor', function (invite){ count += 1; });


    peer5Id = idGen();
    c5.emit('s-join', { peerId: peer5Id, signalData: { predecessor: '5-P', sucessor: '5-S' }});

    function verify() {
      if (count < 5) { return setTimeout(verify, 1000); }
      done();
    }
    verify();
  });



  test('connect one more client', {timeout: 1 * 60 * 1000}, function (done) {


    // s-join
    //   c-sucessor
    //     s-response
    //   c-predecessor
    //     s-response
    //       c-response

   
    c1.on('c-sucessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          sucessor: 'signal data'
        }
      };
      c1.emit('s-response', inviteReply);
    });

    c2.on('c-sucessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          sucessor: 'signal data'
        }
      };
      c2.emit('s-response', inviteReply);
    });

    c3.on('c-sucessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          sucessor: 'signal data'
        }
      };
      c3.emit('s-response', inviteReply);
    });

    c4.on('c-sucessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          sucessor: 'signal data'
        }
      };
      c4.emit('s-response', inviteReply);
    });

    c5.on('c-sucessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          sucessor: 'signal data'
        }
      };
      c5.emit('s-response', inviteReply);
    });

    c1.on('c-predecessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          predecessor: 'signal data'
        }
      };
      c1.emit('s-response', inviteReply);
    });
    c2.on('c-predecessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          predecessor: 'signal data'
        }
      };
      c2.emit('s-response', inviteReply);
    });
    c3.on('c-predecessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          predecessor: 'signal data'
        }
      };
      c3.emit('s-response', inviteReply);
    });
    
    c4.on('c-predecessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: { predecessor: 'signal data' }
      };
      c4.emit('s-response', inviteReply);
    });

    c5.on('c-predecessor', function (invite) {
      var inviteReply = {
        peerId: invite.peerId,
        signalData: {
          predecessor: 'signal data'
        }
      };
      c5.emit('s-response', inviteReply);
    });

    var c6 = io.connect(socketURL, options);
    
    c6.on('connect', function() { 
      var peer6Id = idGen();

      var invite = { peerId: peer6Id, signalData: { predecessor: 'c-6', sucessor: 'c-6' } };

      c6.emit('s-join', invite);
      c6.on('c-response', function (inviteReply) {
        // console.log('inviteReply', inviteReply);
        done();
      });
    });
  });


});

function idGen () {
  return git_sha1((~~(Math.random() * 1e9)).toString(36) + Date.now());
}