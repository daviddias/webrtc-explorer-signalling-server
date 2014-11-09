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

experiment('Serving 2 Client.', function () {
  var server;
  var client_1;
  var client_2;
  var client_3;
  var client_4;
  var client_5;

  var peer_1_Id;
  var peer_2_Id;
  var peer_3_Id;
  var peer_4_Id;
  var peer_5_Id;

  var options ={
    transports: ['websocket'],
    'force new connection': true
  };

  var socketURL = 'http://localhost:9000';

  before(function (done) {
    server = spawn('node', ['./index.js']);
    server.stdout.on('data', function (data) {
      // console.log('stdout: ' + data);
    });
    server.stderr.on('data', function (data) {
      // console.log('stderr: ' + data);
    });

    setTimeout(function () { 
      done(); 
    }, 1000);
  });

  after(function (done) {
    client_1.disconnect();
    client_2.disconnect();
    client_3.disconnect();
    client_4.disconnect();
    client_5.disconnect();

    setTimeout(function () { 
      server.on('close', function (code) {
        // console.log('cp exited: ' + code);
        done();
      });

      server.kill(); 
    }, 1500);
  });

  test('connect the first client', function (done) {
    client_1 = io.connect(socketURL, options);
    client_1.on('connect', function() { 
      done(); 
    });
  });

  test('connect the second client', function (done) {
    client_2 = io.connect(socketURL, options);
    client_2.on('connect', function() { 
      done(); 
    });
  });

  test('connect the third client', function (done) {
    client_3 = io.connect(socketURL, options);
    client_3.on('connect', function() { 
      done(); 
    });
  });

  test('connect the fourth client', function (done) {
    client_4 = io.connect(socketURL, options);
    client_4.on('connect', function() { 
      done(); 
    });
  });

  test('connect the fifth client', function (done) {
    client_5 = io.connect(socketURL, options);
    client_5.on('connect', function() { 
      done(); 
    });
  });


  test('first of 5 clients joins', function (done) {
    peer_1_Id = idGen();

    var invite = {
      peerId: peer_1_Id,
      predecessor: '1-P',
      sucessor: '1-S'
    };

    client_1.emit('s-join', invite);
    done();
  });

  test('second of 5 clients joins', function (done) {
    peer_2_Id = idGen();

    var invite = {
      peerId: peer_2_Id,
      predecessor: '2-P',
      sucessor: '2-S'
    };

    client_2.emit('s-join', invite);
    done();
  });

  test('third of 5 clients joins', function (done) {
    peer_3_Id = idGen();

    var invite = {
      peerId: peer_3_Id,
      predecessor: '3-P',
      sucessor: '3-S'
    };

    client_3.emit('s-join', invite);
    done();
  });

  test('fourth of 5 clients joins', function (done) {
    peer_4_Id = idGen();

    var invite = {
      peerId: peer_4_Id,
      predecessor: '4-P',
      sucessor: '4-S'
    };

    client_4.emit('s-join', invite);
    done();
  });  

  test('last of 5 clients join and network gets bootstrapped', {timeout: 1 * 60 * 1000},function (done) {
    var responseArr = [];

    client_1.on('c-response', function (inviteReply) {
      responseArr.push(inviteReply);
    });
    client_2.on('c-response', function (inviteReply) {
      responseArr.push(inviteReply);
    });
    client_3.on('c-response', function (inviteReply) {
      responseArr.push(inviteReply);
    });
    client_4.on('c-response', function (inviteReply) {
      responseArr.push(inviteReply);
    });
    client_5.on('c-response', function (inviteReply) {
      responseArr.push(inviteReply);
    });


    peer_5_Id = idGen();

    var invite = {
      peerId: peer_5_Id,
      predecessor: '5-P',
      sucessor: '5-S'
    };

    client_5.emit('s-join', invite);

    function verify() {
      if (responseArr.length < 5) {
        return setTimeout(verify, 1000);
      }
      // console.log('RESPONSE ARRAY\n', responseArr);
      // add a test to check if the signal data was propagated circularly 
      done();
    }

    verify();
  });

  test('connect one more client', {timeout: 1 * 60 * 1000}, function (done) {
   
    client_1.on('c-sucessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.sucessor = 'c_sucessor_1';
      client_1.emit('s-response', inviteReply);
    });

    client_2.on('c-sucessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.sucessor = 'c_sucessor_2';
      client_2.emit('s-response', inviteReply);
    });

    client_3.on('c-sucessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.sucessor = 'c_sucessor_3';
      client_3.emit('s-response', inviteReply);
    });

    client_4.on('c-sucessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.sucessor = 'c_sucessor_4';
      client_4.emit('s-response', inviteReply);
    });

    client_5.on('c-sucessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.sucessor = 'c_sucessor_5';
      client_5.emit('s-response', inviteReply);
    });

    client_1.on('c-predecessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.predecessor = 'c_predecessor_1';
      client_1.emit('s-response', inviteReply);
    });
    client_2.on('c-predecessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.predecessor = 'c_predecessor_2';
      client_2.emit('s-response', inviteReply);
    });
    client_3.on('c-predecessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.predecessor = 'c_predecessor_3';
      client_3.emit('s-response', inviteReply);
    });
    client_4.on('c-predecessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.predecessor = 'c_predecessor_4';
      client_4.emit('s-response', inviteReply);
    });
    client_5.on('c-predecessor', function (invite) {
      var inviteReply = {};
      inviteReply.peerId = invite.peerId;
      inviteReply.predecessor = 'c_predecessor_5';
      client_5.emit('s-response', inviteReply);
    });

    var client_6 = io.connect(socketURL, options);
    
    client_6.on('connect', function() { 
      var peer_6_Id = idGen();

      var invite = {
        peerId: peer_6_Id,
        predecessor: 'THIS WOULD BE SIGNAL DATA',
        sucessor: 'THIS WOULD BE SIGNAL DATA'
      };

      client_6.emit('s-join', invite);
      client_6.on('c-response', function (inviteReply) {
        // console.log('inviteReply', inviteReply);
        done();
      });
    });


  });


});

function idGen () {
  return git_sha1((~~(Math.random() * 1e9)).toString(36) + Date.now());
}