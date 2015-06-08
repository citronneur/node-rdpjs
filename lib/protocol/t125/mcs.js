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
var layer = require('../../core').layer;
var type = require('../../core').type;
var gcc = require('./gcc');
var ber = require('./ber');
var per = require('./per');

var MESSAGE = {
	MCS_TYPE_CONNECT_INITIAL : 0x65,
	MCS_TYPE_CONNECT_RESPONSE : 0x66
};

var DOMAIN_MCS_PDU = {
    ERECT_DOMAIN_REQUEST : 1,
    DISCONNECT_PROVIDER_ULTIMATUM : 8,
    ATTACH_USER_REQUEST : 10,
    ATTACH_USER_CONFIRM : 11,
    CHANNEL_JOIN_REQUEST : 14,
    CHANNEL_JOIN_CONFIRM : 15,
    SEND_DATA_REQUEST : 25,
    SEND_DATA_INDICATION : 26
};

var CHANNEL = {
    MCS_GLOBAL_CHANNEL : 1003,
    MCS_USERCHANNEL_BASE : 1001
};
    
/**
 * Write Domain parameters
 * @param maxChannels {integer} 
 * @param maxUsers {integer} 
 * @param maxTokens {integer} 
 * @param maxPduSize {integer} 
 * @returns {type.Component} mcs domain param
 */
function writeDomainParams (maxChannels, maxUsers, maxTokens, maxPduSize) {
    var domainParam = new type.Component([
	    ber.writeInteger(maxChannels), ber.writeInteger(maxUsers), ber.writeInteger(maxTokens),
	    ber.writeInteger(1), ber.writeInteger(0), ber.writeInteger(1),
	    ber.writeInteger(maxPduSize), ber.writeInteger(2)
	]);
    
    return new type.Component([
	    ber.writeUniversalTag(ber.BER_TAG.BER_TAG_SEQUENCE, true), 
	    ber.writeLength(domainParam.size()), 
	    domainParam
	]);
}

/**
 * Read domain param structure (not very usefull)
 * @param s {type.Stream}
 */
function readDomainParams(s) {
    if (!ber.readUniversalTag(s, ber.BER_TAG.BER_TAG_SEQUENCE, true)) {
    	throw 'NODE_RDP_PROTOCOL_T125_MCS_BAD_BER_TAG';
    }
    ber.readLength(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
    ber.readInteger(s);
}

/**
 * Format MCS PDU header packet
 * @param mcsPdu {integer}
 * @param options {integer}
 * @returns {type.UInt8} headers
 */
function writeMCSPDUHeader(mcsPdu, options) {
	options = options || 0;
    return new type.UInt8((mcsPdu << 2) | options);
}

/**
 * Read MCS PDU header
 * @param opcode
 * @param mcsPdu
 * @returns {Boolean}
 */
function readMCSPDUHeader(opcode, mcsPdu) {
	return (opcode >> 2) == mcsPdu;
}

/**
 * Multi-Channel Services
 * @param presentation {layer.Layer} presentation layer main channel (graphic channel)
 */
function MCS(presentation) {
	layer.Layer.call(this, presentation);
	//init gcc information
	this.clientCoreData = gcc.clientCoreData();
	this.clientNetworkData = gcc.clientNetworkData();
	this.clientSecurityData = gcc.clientSecurityData();
}

//inherit from Layer
inherits(MCS, layer.Layer);

/**
 * 
 * @param presentation {layer.Layer} presentation layer for message
 * @returns
 */
function Client(presentation) {
	MCS.call(this, presentation);
}

inherits(Client, MCS);

/**
 * Connect event layer
 */
Client.prototype.connect = function() {
	this.sendConnectInitial();
};

/**
 * First MCS message
 */
Client.prototype.sendConnectInitial = function() {
	
	var ccReq = gcc.writeConferenceCreateRequest(new type.Component([
	    gcc.block(this.clientCoreData), 
	    gcc.block(this.clientNetworkData), 
	    gcc.block(this.clientSecurityData)
	]));
	
	var ccReqStream = new type.Stream(ccReq.size());
	ccReq.write(ccReqStream);
	
	tmp = new type.Component([
	    ber.writeOctetstring(new Buffer('\x01')), ber.writeOctetstring(new Buffer('\x01')), ber.writeBoolean(true),
	    writeDomainParams(34, 2, 0, 0xffff),
	    writeDomainParams(1, 1, 1, 0x420),
	    writeDomainParams(0xffff, 0xfc17, 0xffff, 0xffff),
	    ber.writeOctetstring(ccReqStream.getValue())
    ]);
	
	this.transport.send(new type.Component([ber.writeApplicationTag(MESSAGE.MCS_TYPE_CONNECT_INITIAL, tmp.size()), tmp]));
	
	// next event is connect response
	this.recv = this.recvConnectResponse;
};

/**
 * MCS connect response (server->client)
 * @param s {type.Stream}
 */
Client.prototype.recvConnectResponse = function(s) {
    ber.readApplicationTag(s, MESSAGE.MCS_TYPE_CONNECT_RESPONSE);
    ber.readEnumerated(s);
    ber.readInteger(s);
    readDomainParams(s);
    if (!ber.readUniversalTag(s, ber.BER_TAG.BER_TAG_OCTET_STRING, false)) {
    	throw 'NODE_RDP_PROTOCOL_T125_MCS_INVALID_BER_TAG';
    }
    
    var gccRequestLength = ber.readLength(s);
    if (s.availableLength() != gccRequestLength) {
    	throw 'NODE_RDP_PROTOCOL_T125_MCS_INVALID_GCC_SIZE_REQUEST';
    }
    
    this.serverSettings = gcc.readConferenceCreateResponse(s);
    
    // send domain request
    this.sendErectDomainRequest();
    // send attach user request
    this.sendAttachUserRequest();
    // now wait user confirm from server
    this.recv = this.recvAttachUserConfirm;
};

/**
 * MCS connection automata step
 * @param s {type.Stream}
 */
Client.prototype.recvAttachUserConfirm = function(s) {
    if (!readMCSPDUHeader(new type.UInt8().read(s).value, DOMAIN_MCS_PDU.ATTACH_USER_CONFIRM)) {
    	throw 'NODE_RDP_PROTOCOL_T125_MCS_BAD_HEADER';
    }
    
    if (per.readEnumerates(s) != 0) {
    	throw 'NODE_RDP_PROTOCOL_T125_MCS_SERVER_REJECT_USER';
    }
    
    this.userId = per.readInteger16(s, CHANNEL.MCS_USERCHANNEL_BASE);
        
    //this.connectNextChannel()
};

/**
 * MCS connection automata step
 * @param s {type.Stream}
 */
Client.prototype.sendErectDomainRequest = function(s) {
    this.transport.send(new type.Component([
	    writeMCSPDUHeader(DOMAIN_MCS_PDU.ERECT_DOMAIN_REQUEST),
	    per.writeInteger(0),
	    per.writeInteger(0)
    ]));
};

/**
 * MCS connection automata step
 * @param s {type.Stream}
 */
Client.prototype.sendAttachUserRequest = function(s) {
    this.transport.send(writeMCSPDUHeader(DOMAIN_MCS_PDU.ATTACH_USER_REQUEST));
};

/**
 * Module exports
 */
module.exports = {
		Client : Client
};
