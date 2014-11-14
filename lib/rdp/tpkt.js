var inherits = require('util').inherits;
var Layer = require('../net').layer.Layer;
var binary = require('../net').binary;

/**
 * Type of tpkt packet
 * Fastpath is use to shortcut RDP stack
 * @see http://msdn.microsoft.com/en-us/library/cc240621.aspx
 * @see http://msdn.microsoft.com/en-us/library/cc240589.aspx
 */
var ACTION = {
	FASTPATH_ACTION_FASTPATH : 0x0,
    FASTPATH_ACTION_X224 : 0x3
};

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
	this.transport.send(new binary.ObjectType([
                   new binary.UInt8(ACTION.FASTPATH_ACTION_X224), 
                   new binary.UInt8(0),
                   new binary.UInt16Be(19),
                   data
                   ]));
};

/**
 * Module exports
 */
module.exports = TPKT;

