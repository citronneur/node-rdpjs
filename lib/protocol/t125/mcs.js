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

var MESSAGE = {
	MCS_TYPE_CONNECT_INITIAL : 0x65,
	MCS_TYPE_CONNECT_RESPONSE : 0x66
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
 * Multi-Channel Services
 * @param presentation {layer.Layer} presentation layer main channel (graphic channel)
 */
function MCS(presentation) {
	layer.Layer.call(this, presentation);
	this.clientSettings = gcc.clientSettings();
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
	var ccReq = gcc.writeConferenceCreateRequest(this.clientSettings);
	var ccReqStream = new type.Stream(ccReq.size());
	ccReq.write(ccReqStream);
	
	tmp = new type.Component([
	    ber.writeOctetstring("\x01"), ber.writeOctetstring("\x01"), ber.writeBoolean(true),
	    writeDomainParams(34, 2, 0, 0xffff),
	    writeDomainParams(1, 1, 1, 0x420),
	    writeDomainParams(0xffff, 0xfc17, 0xffff, 0xffff),
	    ber.writeOctetstring(ccReqStream.toString())
    ]);
	
	this.transport.send(new type.Component([ber.writeApplicationTag(MESSAGE.MCS_TYPE_CONNECT_INITIAL, tmp.size()), tmp]));
};

/**
 * Module exports
 */
module.exports = {
		Client : Client
};
