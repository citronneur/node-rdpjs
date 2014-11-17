var inherits = require('util').inherits;
var binary = require('./binary');
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
		var offset = 0;
		
		//create expected data
		while(true) {
			var buffer = this.buffers.shift();
			if(!buffer)
				break;
			var lengthToCopy = Math.min(buffer.length, this.expectedSize - offset);
			buffer.copy(expectedData.buffer, 0, offset, lengthToCopy);
			offset += lengthToCopy;
			
			//replace unuse data
			if(lengthToCopy < buffer.length)
				this.buffers.unshift(buffer.slice(lengthToCopy + 1));
			
			if(offset == this.expectedSize)
				break;
		}
	}
};

/**
 * Call tcp socket to write stream
 * @param {binary.Type} packet
 */
BufferLayer.prototype.send = function(data) {
	var s = new binary.Stream(data.size());
	s.writeType(data);
	this.socket.write(s.buffer);
};

/**
 * Wait expected size data before call callback function
 * @param {number} expectSize	size expected
 * @param {function} callback	call when enough data was receive	
 */
BufferLayer.prototype.expect = function(expectedSize) {
	
};


/**
 * Module exports
 */
module.exports = {
	Layer : Layer,
	BufferLayer : BufferLayer
};
