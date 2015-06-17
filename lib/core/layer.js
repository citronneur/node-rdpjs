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
var events = require('events');

// var hexy = require('hexy');


/**
 * Buffer data from socket to present
 * well formed packets
 */
function BufferLayer(socket) {
	//for ssl connection
	this.cleartext = null;
	this.socket = socket;
	
	var self = this;
	// bind event
	this.socket.on('data', function(data) {
		self.recv(data);
	});
	
	//buffer data
	this.buffers = [];
	this.bufferLength = 0;
	//expected size
	this.expectedSize = 0;
}

inherits(BufferLayer, events.EventEmitter);

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
		this.emit('data', expectedData);
	}
};

/**
 * Call tcp socket to write stream
 * @param {type.Type} packet
 */
BufferLayer.prototype.send = function(data) {
	var s = new type.Stream(data.size());
	data.write(s);
	// console.log('\n' + hexy.hexy(s.buffer) + '\n');
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
	BufferLayer : BufferLayer
};
