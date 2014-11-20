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
	var version = new binary.UInt8();
	data.readType(version);
	if(version.value == ACTION.FASTPATH_ACTION_X224) {
		data.readType(new binary.UInt8());
		this.transport.expect(2);
		this.recv = this.recvExtendedHeader;
	}
	else {
		
	}
};

/**
 * Receive second part of header packet
 * @param {Stream} data
 */
TPKT.prototype.recvExtendedHeader = function(data) {
	var size = new binary.UInt16Be();
	data.readType(size);
	this.transport.expect(size.value - 4);
	//next state receive packet
	this.recv = this.recvData;
};

/**
 * Receive data available for presentation layer
 * @param {Stream} data
 */
TPKT.prototype.recvData = function(data) {
	this.presentation.recv(data);
	this.transport.expect(2);
	//next state receive header
	this.recv = this.recvHeader;
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

