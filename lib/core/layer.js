var inherits = require('util').inherits;
var binary = require('./binary');
var starttls = require('starttls');
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
 * Buffer data from socket to present
 * well formed packets
 */
function BufferLayer(socket, presentation) {
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
		var expectedData = new binary.Stream(this.expectedSize);
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
 * @param {binary.Type} packet
 */
BufferLayer.prototype.send = function(data) {
	var s = new binary.Stream(data.size());
	data.write(s);
	this.socket.write(s.buffer);
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
 * @param {func} callback when connection is done
 */
BufferLayer.prototype.startTLS = function(callback) {
	starttls(this.socket, callback);
};

/**
 * Module exports
 */
module.exports = {
	Layer : Layer,
	BufferLayer : BufferLayer
};
