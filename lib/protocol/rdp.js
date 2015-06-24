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

var net = require('net');
var inherits = require('util').inherits;
var events = require('events');
var layer = require('../core').layer;
var TPKT = require('./tpkt');
var x224 = require('./x224');
var t125 = require('./t125');
var pdu = require('./pdu');

/**
 * Main RDP module
 */
function RdpClient(config) {
	config = config || {};
	
	this.bufferLayer = new layer.BufferLayer(new net.Socket());
	this.tpkt = new TPKT(this.bufferLayer);
	this.x224 = new x224.Client(this.tpkt);
	this.mcs = new t125.mcs.Client(this.x224);
	this.sec = new pdu.sec.Client(this.mcs);
	this.global = new pdu.global.Client(this.sec);
	
	// credentials
	if(config.domain) {
		this.sec.infos.obj.domain.value = new Buffer(config.domain + '\x00', 'ucs2');
	}
	if(config.userName) {
		this.sec.infos.obj.userName.value = new Buffer(config.userName + '\x00', 'ucs2');
	}
	if(config.password) {
		this.sec.infos.obj.password.value = new Buffer(config.password + '\x00', 'ucs2');
	}
	
	//bind all events
	var self = this;
	this.global.on('connect', function() {
		self.emit('connect');
	});
	this.global.on('session', function() {
		self.emit('session');
	});
	this.global.on('bitmap', function(bitmaps) {
		for(var bitmap in bitmaps) {
			self.emit('bitmap', { 
				destTop : bitmaps[bitmap].obj.destTop.value,
				destLeft : bitmaps[bitmap].obj.destLeft.value, 
				destBottom : bitmaps[bitmap].obj.destBottom.value, 
				destRight : bitmaps[bitmap].obj.destRight.value, 
				width : bitmaps[bitmap].obj.width.value,
				height : bitmaps[bitmap].obj.height.value,
				bitsPerPixel : bitmaps[bitmap].obj.bitsPerPixel.value,
				isCompress : bitmaps[bitmap].obj.flags.value & pdu.data.BitmapFlag.BITMAP_COMPRESSION,
				data : bitmaps[bitmap].obj.bitmapDataStream.value
			});
		}
	});
}

//inherit from Layer
inherits(RdpClient, events.EventEmitter);

/**
 * Connect RDP client
 * @param host {string} destination host
 * @param port {integer} destination port
 */
RdpClient.prototype.connect = function(host, port) {
	var self = this;
	this.bufferLayer.socket.connect(port, host, function() {
		// in client mode connection start from x224 layer
		self.x224.connect();
	});
};

function createClient(config) {
	return new RdpClient(config);
}

/**
 * Module exports
 */
module.exports = {
		createClient : createClient
};