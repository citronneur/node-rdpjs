/*
 * Copyright (c) 2014-2015 Sylvain Peyrefitte
 *
 * This file is part of node-rdp.
 *
 * node-rdp is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var inherits = require('util').inherits;
var type = require('../core').type;
var Layer = require('../core').layer.Layer;
var log = require('../core').log;

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
	this.type = new type.UInt8();
	this.flag = new type.UInt8();
	this.length = new type.UInt16Le(0x0008, { constant : true });
	this.result = new type.UInt32Le();
}

/**
 * X224 client connection request
 * @see	http://msdn.microsoft.com/en-us/library/cc240470.aspx
 */
function ClientConnectionRequestPDU() {
	var self = this;
	this.len = new type.UInt8(function() { 
		return new type.Component(self).size() - 1; 
	});
	this.code = new type.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_REQUEST, { constant : true });
	this.padding = new type.Component([new type.UInt16Le(), new type.UInt16Le(), new type.UInt8()]);
	//TODO cookie field
	this.protocolNeg = new type.Component(new Negotiation(), { optional : true });
}

/**
 * X224 Server connection confirm
 * @see	http://msdn.microsoft.com/en-us/library/cc240506.aspx
 */
function ServerConnectionConfirm() {
	var self = this;
	this.len = new type.UInt8(function() { 
		return new type.Component(self).size() - 1; 
	});
	this.code = new type.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_CONFIRM, { constant : true });
	this.padding = new type.Component([new type.UInt16Le(), new type.UInt16Le(), new type.UInt8()]);
	this.protocolNeg = new type.Component(new Negotiation(), { optional : true });
}

/**
 * Common X224 Automata
 * @param {Layer} presentation
 */
function X224(presentation) {
	Layer.call(this, presentation);
	this.requestedProtocol = PROTOCOLS.PROTOCOL_SSL;
	this.selectedProtocol = PROTOCOLS.PROTOCOL_SSL;
}

//inherit from Layer
inherits(X224, Layer);

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
	this.transport.send(new type.Component(message));
	
	//next state wait connection confirm packet
	this.recv = this.recvConnectionConfirm;
};

/**
 * Receive connection from server
 * @param {Stream} data
 */
Client.prototype.recvConnectionConfirm = function(data) {
	var message = new ServerConnectionConfirm();
	new type.Component(message).read(data);
	
	if(message.protocolNeg.obj.type == NEGOTIATION_TYPE.TYPE_RDP_NEG_FAILURE) {
		throw "NODE_RDP_NEG_FAILURE";
	}
	
	if(message.protocolNeg.obj.type.value == NEGOTIATION_TYPE.TYPE_RDP_NEG_RSP) {
		this.selectedProtocol = message.protocolNeg.obj.result.value;
	}
	
	if([PROTOCOLS.PROTOCOL_HYBRID, PROTOCOLS.PROTOCOL_HYBRID_EX].indexOf(this.selectedProtocol) != -1) {
		throw "NODE_RDP_NLA_NOT_SUPPORTED";
	}
	
	if(this.selectedProtocol == PROTOCOLS.PROTOCOL_RDP) {
		log.warn("RDP standard security selected");
		return;
	}
	
	if(this.selectedProtocol == PROTOCOLS.PROTOCOL_SSL) {
		log.info("SSL standard security selected");
		this.transport.transport.startTLS(false, function(err) {
			log.warn(err);
		});
		return;
	}
};

/**
 * Server x224 automata
 */
function Server() {
	X224.call(this);
}

//inherit from X224 automata
inherits(Server, X224);

/**
 * Module exports
 */
module.exports = {
	Client : Client,
	Server : Server
};
