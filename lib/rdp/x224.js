var inherits = require('util').inherits;
var binary = require('../net').binary;

/**
 * Message type present in X224 packet header
 */
var MESSAGE_TYPE = {
	X224_TPDU_CONNECTION_REQUEST : 0xE0,
	X224_TPDU_CONNECTION_CONFIRM : 0xD0,
	X224_TPDU_DISCONNECT_REQUEST : 0x80,
	X224_TPDU_DATA : 0xF0,
	X224_TPDU_ERROR : 0x70
};

/**
 * Type of negotiation present in negotiation packet
 */
var NEGOTIATION_TYPE = {
	TYPE_RDP_NEG_REQ : 0x01,
    TYPE_RDP_NEG_RSP : 0x02,
    TYPE_RDP_NEG_FAILURE : 0x03	
};

/**
 * Protocols available for x224 layer
 */
var PROTOCOLS = {
	PROTOCOL_RDP : 0x00000000,
    PROTOCOL_SSL : 0x00000001,
    PROTOCOL_HYBRID : 0x00000002,
    PROTOCOL_HYBRID_EX : 0x00000008	
};

/**
 * Use to negotiate security layer of RDP stack
 * In node-rdp only ssl is available
 * @see request -> http://msdn.microsoft.com/en-us/library/cc240500.aspx
 * @see response -> http://msdn.microsoft.com/en-us/library/cc240506.aspx
 * @see failure ->http://msdn.microsoft.com/en-us/library/cc240507.aspx
 */
function Negotiation() {
	this.code = new binary.Int8();
	this.flag = new binary.Int8();
	this.len = new binary.UInt16Le(0x0008, { constant : true });
	this.result = new binary.UInt32Le();
}

/**
 * X224 client connection request
 * @see	http://msdn.microsoft.com/en-us/library/cc240470.aspx
 */
function ClientConnectionRequestPDU() {
	this.len = new binary.Int8();
	this.code = new binary.Int8(MESSAGE_TYPE.X224_TPDU_CONNECTION_REQUEST);
	this.padding = new binary.ObjectType([new binary.UInt16Le(), new binary.UInt16Le(), new binary.Int8()]);
	//TODO cookie field
	this.protocolNeg = new binary.ObjectType(new Negotiation(), { optional : true });
}

/**
 * Common X224 Automata
 * @param {Layer} presentation
 */
function X224(presentation) {
	this.presentation = presentation;
}

/**
 * Client x224 automata
 */
function Client() {
	X224.call(this);
}

//inherit from X224 automata
inherits(Client, X224);

/**
 * Client automata connect event
 */
Client.prototype.connect = function() {
	var message = new ClientConnectionRequestPDU();
	message.protocolNeg.obj.code.value = NEGOTIATION_TYPE.TYPE_RDP_NEG_REQ;
	message.protocolNeg.obj.result.value = PROTOCOLS.PROTOCOL_SSL;
	this.transport.send(message);
};

/**
 * Module exports
 */
module.exports = {
	Client : Client
};