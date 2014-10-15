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

experiment('Serving 2 Client.', function () {
  var server;
  var client_1;
  var client_2;
  var client_3;
  var client_4;
  var client_5;

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

    client_1.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(false);
      done();
    });
  });

  test('connect the second client', function (done) {
    client_2 = io.connect(socketURL, options);

    client_2.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(true);
      done();
    });
  });

  test('connect the third client', function (done) {
    client_3 = io.connect(socketURL, options);

    client_3.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(true);
      done();
    });
  });

  test('connect the fourth client', function (done) {
    client_4 = io.connect(socketURL, options);

    client_4.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(true);
      done();
    });
  });

  test('connect the fifth client', function (done) {
    client_5 = io.connect(socketURL, options);

    client_5.on('c-connection-established', function(data) {
      expect(data).to.have.property('peersAvailable').to.equal(true);
      done();
    });
  });

  test('connect to one of the clients', function (done) {
    var peerInvite = {
      signalData: 'signaling data that will passed by the browsers'
    };
    
    client_2.on('c-connection-request', function (data) {
      expect(data).has.property('signalData');
      expect(data.ticket.requester).to.not.equal(data.ticket.solicited);
      data.signalData = 'update signal data';
      client_2.emit('s-connect-response', data);
    });
    
    client_3.on('c-connection-request', function (data) {
      expect(data).has.property('signalData');
      expect(data.ticket.requester).to.not.equal(data.ticket.solicited);
      data.signalData = 'update signal data';
      client_3.emit('s-connect-response', data);
    });

    client_4.on('c-connection-request', function (data) {
      expect(data).has.property('signalData');
      expect(data.ticket.requester).to.not.equal(data.ticket.solicited);
      data.signalData = 'update signal data';
      client_4.emit('s-connect-response', data);
    });

    client_5.on('c-connection-request', function (data) {
      expect(data).has.property('signalData');
      expect(data.ticket.requester).to.not.equal(data.ticket.solicited);
      data.signalData = 'update signal data';
      client_5.emit('s-connect-response', data);
    });

    client_1.on('c-connection-response', function(data) {
      expect(data).has.property('signalData');
      expect(data.signalData).to.equal('update signal data');
      expect(data.ticket.requester).to.not.equal(data.ticket.solicited);  
      done();
    });

    client_1.emit('s-connect-request', peerInvite);
  });


});