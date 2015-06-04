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
var Layer = require('../core').layer.Layer;
var type = require('../core').type;

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
 * @param s {type.Stream}
 */
TPKT.prototype.recvHeader = function(s) {
	var version = new type.UInt8().read(s);
	if(version.value == ACTION.FASTPATH_ACTION_X224) {
		new type.UInt8().read(s);
		this.transport.expect(2);
		this.recv = this.recvExtendedHeader;
	}
	else {
		
	}
};

/**
 * Receive second part of header packet
 * @param s {type.Stream}
 */
TPKT.prototype.recvExtendedHeader = function(s) {
	var size = new type.UInt16Be().read(s);
	this.transport.expect(size.value - 4);
	//next state receive packet
	this.recv = this.recvData;
};

/**
 * Receive data available for presentation layer
 * @param s {type.Stream}
 */
TPKT.prototype.recvData = function(s) {
	this.presentation.recv(s);
	this.transport.expect(2);
	//next state receive header
	this.recv = this.recvHeader;
};

/**
 * Send message throught TPKT layer
 * @param message {type.*}
 */
TPKT.prototype.send = function(message) {
	this.transport.send(new type.Component([
	    new type.UInt8(ACTION.FASTPATH_ACTION_X224),
	    new type.UInt8(0),
	    new type.UInt16Be(message.size() + 4),
	    message
	]));
};

/**
 * Module exports
 */
module.exports = TPKT;

