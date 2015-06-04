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
var type = require('./type');
var log = require('./log');
var starttls = require('starttls');
var tls = require('tls');
var crypto = require('crypto');

/**
 * Generic ctor for layer
 * @param {Layer} presentation
 * @returns new layer
 */
function Layer(presentation) {
	this.transport = null;
	this.presentation = presentation || null;
	
	//init if not null
	if(this.presentation) {
		this.presentation.transport = this;
	}
}

/**
 * Default connect event
 * Is transparent event
 */
Layer.prototype.connect = function() {
	if(this.presentation) {
		this.presentation.connect();
	}
};

/**
 * Default close event
 * Is transparent event
 */
Layer.prototype.close = function() {
	if(this.transport) {
		this.transport.close();
	}
};

/**
 * Must be implemented
 */
Layer.prototype.send = function() {
	throw "NODE_RDP_LAYER_SEND_NOT_IMPLEMENTED";
};

/**
 * Must be implemented
 */
Layer.prototype.recv = function() {
	throw "NODE_RDP_LAYER_RECV_NOT_IMPLEMENTED";
};

/**
 * Buffer data from socket to present
 * well formed packets
 */
function BufferLayer(socket, presentation) {
	//for ssl connection
	this.cleartext = null;
	this.socket = socket;
	Layer.call(this, presentation);
	//buffer data
	this.buffers = [];
	this.bufferLength = 0;
	//expected size
	this.expectedSize = 0;
}

inherits(BufferLayer, Layer);

/**
 * Call from tcp layer
 * @param data tcp stream
 */
BufferLayer.prototype.recv = function(data) {
	this.buffers[this.buffers.length] = data;
	this.bufferLength += data.length;
	
	while(this.bufferLength >= this.expectedSize) {
		//linear buffer
		var expectedData = new type.Stream(this.expectedSize);
		var rest = this.expectedSize;
		
		//create expected data
		while(true) {
			if(rest == 0)
				break;
			
			var buffer = this.buffers.shift();
			
			if(buffer.length > rest) {
				this.buffers.unshift(buffer.slice(this.expectedSize));
				buffer.copy(expectedData.buffer, 0, this.expectedSize - rest, rest);
				break;
			}
			else {
				buffer.copy(expectedData.buffer, 0, this.expectedSize - rest);
				rest -= buffer.length;
			}
		}
		
		this.bufferLength -= this.expectedSize;
		this.presentation.recv(expectedData);
	}
};

/**
 * Call tcp socket to write stream
 * @param {type.Type} packet
 */
BufferLayer.prototype.send = function(data) {
	var s = new type.Stream(data.size());
	data.write(s);
	if(this.cleartext) {
		this.cleartext.write(s.buffer);
	}
	else {
		this.socket.write(s.buffer);
	}
};

/**
 * Wait expected size data before call callback function
 * @param {number} expectSize	size expected
 */
BufferLayer.prototype.expect = function(expectedSize) {
	this.expectedSize = expectedSize;
};

/**
 * Convert connection to TLS connection
 * Use nodejs starttls module
 * @param isServer {bool} true when you are as server side
 * @param callback {func} when connection is done
 */
BufferLayer.prototype.startTLS = function(isServer, callback) {
	options = {
			socket : this.socket,
			pair : tls.createSecurePair(crypto.createCredentials(), isServer, false, false)
	};
	var self = this;
	starttls(options, function(err) {
		log.warn(err);
		self.cleartext = this.cleartext;
		self.cleartext.on('data', function(data) {
			self.recv(data);
		});
		callback();
	});
};

/**
 * Module exports
 */
module.exports = {
	Layer : Layer,
	BufferLayer : BufferLayer
};
