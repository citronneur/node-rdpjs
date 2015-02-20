var inherits = require('util').inherits;
var binary = require('../core').binary;

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
	this.type = new binary.UInt8();
	this.flag = new binary.UInt8();
	this.length = new binary.UInt16Le(0x0008, { constant : true });
	this.result = new binary.UInt32Le();
}

/**
 * X224 client connection request
 * @see	http://msdn.microsoft.com/en-us/library/cc240470.aspx
 */
function ClientConnectionRequestPDU() {
	var self = this;
	this.len = new binary.UInt8(function() { 
		return new binary.ObjectType(self).size() - 1; 
	});
	this.code = new binary.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_REQUEST, { constant : true });
	this.padding = new binary.ObjectType([new binary.UInt16Le(), new binary.UInt16Le(), new binary.UInt8()]);
	//TODO cookie field
	this.protocolNeg = new binary.ObjectType(new Negotiation(), { optional : true });
}

/**
 * X224 Server connection confirm
 * @see	http://msdn.microsoft.com/en-us/library/cc240506.aspx
 */
function ServerConnectionConfirm() {
	var self = this;
	this.len = new binary.UInt8(function() { 
		return new binary.ObjectType(self).size() - 1; 
	});
	this.code = new binary.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_CONFIRM, { constant : true });
	this.padding = new binary.ObjectType([new binary.UInt16Le(), new binary.UInt16Le(), new binary.UInt8()]);
	this.protocolNeg = new binary.ObjectType(new Negotiation(), { optional : true });
}

/**
 * Common X224 Automata
 * @param {Layer} presentation
 */
function X224(presentation) {
	this.presentation = presentation;
	this.requestedProtocol = PROTOCOLS.PROTOCOL_SSL;
	this.selectedProtocol = PROTOCOLS.PROTOCOL_SSL;
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
	message.protocolNeg.obj.type.value = NEGOTIATION_TYPE.TYPE_RDP_NEG_REQ;
	message.protocolNeg.obj.result.value = this.requestedProtocol;
	this.transport.send(new binary.ObjectType(message));
	
	//next state wait connection confirm packet
	this.recv = this.recvConnectionConfirm;
};

/**
 * Receive connection from server
 * @param {Stream} data
 */
Client.prototype.recvConnectionConfirm = function(data) {
	var message = new ServerConnectionConfirm();
	new binary.ObjectType(message).read(data);
	
	if(message.protocolNeg.obj.type == NEGOTIATION_TYPE.TYPE_RDP_NEG_FAILURE) {
		throw "NODE_RDP_NEG_FAILURE";
	}
	
	if(message.protocolNeg.obj.type.value == NEGOTIATION_TYPE.TYPE_RDP_NEG_RSP) {
		this.selectedProtocol = message.protocolNeg.obj.result.value;
	}
	
	if([PROTOCOLS.PROTOCOL_HYBRID, PROTOCOLS.PROTOCOL_HYBRID_EX].indexOf(this.selectedProtocol) != -1) {
		throw "NODE_RDP_NLA_NOT_SUPPORTED";
	}
	
	if(this.selectedProtocol == PROTOCOLS.PROTOCOL_SSL) {
		this.transport.transport.startTLS(function(err) {
			console.log(err);
		});
	}
};

/**
 * Module exports
 */
module.exports = {
	Client : Client
};
