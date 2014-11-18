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
	
	//version of packet (slow or fast path)
	//keep context
	this.lastPacketVersion = new binary.UInt8();
}

/**
 * inherit from a packet layer
 */
inherits(TPKT, Layer);

/**
 * Connect layer event
 * call from transport packet
 */
TPKT.prototype.connect = function() {
	//wait 2 bytes
	this.transport.expect(2);
	//next state is receive header
	this.recv = this.recvHeader;
	
	if(this.presentation)
		this.presentation.connect();
};

/**
 * Receive correct packet as expected
 * @param {Stream} data
 */
TPKT.prototype.recvHeader = function(data) {
	data.readType(this.lastPacketVersion);
};

/**
 * Send data
 * @param data
 */
TPKT.prototype.send = function(data) {
	this.transport.send(new binary.ObjectType([
                   new binary.UInt8(ACTION.FASTPATH_ACTION_X224), 
                   new binary.UInt8(0),
                   new binary.UInt16Be(data.size() + 4),
                   data
                   ]));
};

/**
 * Module exports
 */
module.exports = TPKT;

