// http://liamkaufman.com/blog/2012/01/28/testing-socketio-with-mocha-should-and-socketio-client/

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var io = require('socket.io-client');
var spawn = require('child_process').spawn;

var experiment = lab.experiment;
var test = lab.test;
// var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

experiment('Serving 1 Client.', function () {
  var server;
  var client;

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
    client.disconnect();

    setTimeout(function () { 
      server.on('close', function (code) {
        // console.log('cp exited: ' + code);
        done();
      });  
      server.kill();
    }, 1500);
  });


  test('client connects to the server and there are no more peers', function (done) {
    client = io.connect(socketURL, options);

    client.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(false);
      done();
    });
  });


  test('client tries to connect to another peers and there is 0', function (done) {
    client.on('c-connection-request', function(data) {
      // this shouldn't ever happen
    });

    client.on('c-connection-response', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(false);
      done();
    });

    var peerInvite = {
      signalData: 'signaling data that will passed by the browsers'
    };

    client.emit('s-connect-request', peerInvite);
  });
});