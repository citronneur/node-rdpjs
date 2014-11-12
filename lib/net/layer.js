var inherits = require('util').inherits;

/**
 * Generic ctor for layer
 * @param {Layer} presentation
 * @returns new layer
 */
function Layer(presentation) {
	this.tranport = null;
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
}

inherits(BufferLayer, Layer);

/**
 * call from tcp layer
 * @param data tcp stream
 */
BufferLayer.prototype.recv = function(data) {
		
};

/**
 * call tcp socket to write stream
 * @param data tcp stream
 */
BufferLayer.prototype.send = function(data) {
	this.socket.write(data);
};

/**
 * wait expected size data before call callback function
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
