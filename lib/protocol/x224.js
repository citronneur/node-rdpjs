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
var events = require('events');
var type = require('../core').type;
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
 * @param opt {object} component type options
 * @see request -> http://msdn.microsoft.com/en-us/library/cc240500.aspx
 * @see response -> http://msdn.microsoft.com/en-us/library/cc240506.aspx
 * @see failure ->http://msdn.microsoft.com/en-us/library/cc240507.aspx
 */
function negotiation(opt) {
	var self = {
		type : new type.UInt8(),
		flag : new type.UInt8(),
		length : new type.UInt16Le(0x0008, { constant : true }),
		result : new type.UInt32Le()
	};
	return new type.Component(self, opt);
}

/**
 * X224 client connection request
 * @param opt {object} component type options
 * @see	http://msdn.microsoft.com/en-us/library/cc240470.aspx
 */
function clientConnectionRequestPDU(opt) {
	var self = {
		len : new type.UInt8(function() { 
			return new type.Component(self).size() - 1; 
		}),
		code : new type.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_REQUEST, { constant : true }),
		padding : new type.Component([new type.UInt16Le(), new type.UInt16Le(), new type.UInt8()]),
		protocolNeg : negotiation({ optional : true })
	};

	return new type.Component(self, opt);
}

/**
 * X224 Server connection confirm
 * @param opt {object} component type options
 * @see	http://msdn.microsoft.com/en-us/library/cc240506.aspx
 */
function serverConnectionConfirm(opt) {
	var self = {
		len : new type.UInt8(function() { 
			return new type.Component(self).size() - 1; 
		}),
		code : new type.UInt8(MESSAGE_TYPE.X224_TPDU_CONNECTION_CONFIRM, { constant : true }),
		padding : new type.Component([new type.UInt16Le(), new type.UInt16Le(), new type.UInt8()]),
		protocolNeg : negotiation({ optional : true })
	};

	return new type.Component(self, opt);
}

/**
 * Header of each data message from x224 layer
 * @returns {type.Component}
 */
function x224DataHeader() {
	var self = {
		header : new type.UInt8(2),
		messageType : new type.UInt8(MESSAGE_TYPE.X224_TPDU_DATA, { constant : true }),
		separator : new type.UInt8(0x80, { constant : true })	
	};
	return new type.Component(self);
}

/**
 * Common X224 Automata
 * @param presentation {Layer} presentation layer
 */
function X224(transport) {
	this.transport = transport;
	this.requestedProtocol = PROTOCOLS.PROTOCOL_SSL;
	this.selectedProtocol = PROTOCOLS.PROTOCOL_SSL;
}

//inherit from Layer
inherits(X224, events.EventEmitter);

/**
 * Main data received function 
 * after connection sequence
 * @param s {type.Stream} stream formated from transport layer
 */
X224.prototype.recvData = function(s) {
	// check header
	x224DataHeader().read(s);
	this.emit('data', s);
};

/**
 * Format message from x224 layer to transport layer
 * @param message {type}
 * @returns {type.Component} x224 formated message
 */
X224.prototype.send = function(message) {
	this.transport.send(new type.Component([x224DataHeader(), message]));
};

/**
 * Client x224 automata
 * @param transport {events.EventEmitter} (bind data events)
 */
function Client(transport) {
	X224.call(this, transport);
}

//inherit from X224 automata
inherits(Client, X224);

/**
 * Client automata connect event
 */
Client.prototype.connect = function() {
	var message = clientConnectionRequestPDU();
	message.obj.protocolNeg.obj.type.value = NEGOTIATION_TYPE.TYPE_RDP_NEG_REQ;
	message.obj.protocolNeg.obj.result.value = this.requestedProtocol;
	this.transport.send(message);

	// next state wait connection confirm packet
	var self = this;
	this.transport.once('data', function(s) {
		self.recvConnectionConfirm(s);
	});
};

/**
 * Receive connection from server
 * @param s {Stream}
 */
Client.prototype.recvConnectionConfirm = function(s) {
	var message = serverConnectionConfirm().read(s);

	if(message.obj.protocolNeg.obj.type == NEGOTIATION_TYPE.TYPE_RDP_NEG_FAILURE) {
		throw "NODE_RDP_PROTOCOL_X224_NEG_FAILURE";
	}

	if(message.obj.protocolNeg.obj.type.value == NEGOTIATION_TYPE.TYPE_RDP_NEG_RSP) {
		this.selectedProtocol = message.obj.protocolNeg.obj.result.value;
	}

	if([PROTOCOLS.PROTOCOL_HYBRID, PROTOCOLS.PROTOCOL_HYBRID_EX].indexOf(this.selectedProtocol) != -1) {
		throw "NODE_RDP_PROTOCOL_X224_NLA_NOT_SUPPORTED";
	}

	if(this.selectedProtocol == PROTOCOLS.PROTOCOL_RDP) {
		log.warn("RDP standard security selected");
		return;
	}
	
	// finish connection sequence
	var self = this;
	this.transport.on('data', function(s) {
		self.recvData(s);
	});

	if(this.selectedProtocol == PROTOCOLS.PROTOCOL_SSL) {
		log.info("SSL standard security selected");
		this.transport.transport.startTLS(false, function() {
			self.emit('connect', self.selectedProtocol);
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
