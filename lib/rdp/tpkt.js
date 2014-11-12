var inherits = require('util').inherits;
var Layer = require('../net').layer.Layer;

/**
 * TPKT layer of rdp stack
 * @param {
 */
function TPKT(presentation) {
	Layer.call(this, presentation);
}

/**
 * inherit from a packet layer
 */
inherits(TPKT, Layer);

/**
 * Receive correct packet as expected
 * @param data
 */
TPKT.prototype.recv = function(data) {
	
};

/**
 * Send data
 * @param data
 */
TPKT.prototype.send = function(data) {
	
};

/**
 * Module exports
 */
module.exports = TPKT;

