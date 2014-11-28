var bigInt = require('big-integer');

exports = module.exports;

exports.sortPeerTable = function(peerTable) {
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
  return sorted;
};

exports.sucessorToId = function(peerId, sortedPeerTable) {
  var s = sortedPeerTable;
  var r;
  var bigPeerId = bigInt(peerId, 16);
  var done = false;

  s.forEach(function(value, index) {
    if (done) {
      return;
    }
    var bigValue = bigInt(value, 16);

    if (bigPeerId.compare(bigValue) === 0) {
      r = value;
      done = true;
      return;
    }

    if (bigPeerId.lesser(bigValue)) {
      r = value;
      done = true;
      return;
    }

    if (index + 1 === s.length) {
      r = s[0];
      done = true;
      return;
    }

  });
  return r;
};

exports.predecessorToId = function(peerId, sortedPeerTable) {
  var s = sortedPeerTable;
  var r;
  var bigPeerId = bigInt(peerId, 16);
  var done = false;

  s.forEach(function(value, index) {
    if (done) {
      return;
    }

    if (index + 1 === s.length && bigPeerId.greater(bigInt(value, 16))) {
      r = value;
      done = true;
      return;
    }

    if (bigPeerId.lesser(bigInt(value, 16)) ||
      bigPeerId.compare(bigInt(value, 16)) === 0) {
      if (index === 0) {
        r = s[s.length - 1];
        done = true;
        return;
      }

      r = s[index - 1];
      done = true;
      return;
    }
  });
  return r;
};
