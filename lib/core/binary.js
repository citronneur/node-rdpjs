var inherits = require('util').inherits;

/**
 * Stream wrapper around buffer type
 * @param {string} data init data
 * @returns
 */
function Stream(data) {
	this.offset = 0;
	this.buffer = new Buffer(data || 8192);
}

/**
 * Return length of available data in stream
 * @returns {Number} length of available data in stream
 */
Stream.prototype.availableLength = function() {
	return this.buffer.length - this.offset;
};

/**
 * Type readable or writable by binary stream
 * @param {object} opt 
 * 			.conditional read or write type depend on conditional call
 * @returns
 */
function Type(opt) {
	this.opt = opt || {};
	this.isReaded = false;
	this.isWritten = false;
}

/**
 * Write type into binary stream s
 * @param {Stream} s binary stream
 */
Type.prototype.write = function(s) {
	//do not write false conditional type
	if(this.opt.conditional && !this.opt.conditional())
		return;
	
	this.isWritten = true;
	
	this.writeValue(s);
};

/**
 * Read type from binary stream 
 * @param {Stream} s binary stream
 */
Type.prototype.read = function(s) {
	//do not read false conditional type
	if(this.opt.conditional && !this.opt.conditional())
		return;
	
	if(this.opt.optional && s.availableLength() < this.size())
		return;
	
	this.isReaded = true;
	
	//constant case
	if(this.opt.constant) {
		var oldValue = this.value;
		this.readValue(s);
		if(oldValue != this.value)
			throw "Invalid constant value " + oldValue + " != " + this.value();
	}
	else {
		this.readValue(s);
	}
};

/**
 * Size of type
 * @returns {int} Size of type
 */
Type.prototype.size = function() {
	if(this.opt.conditional && !this.opt.conditional())
		return 0;
	return this._size_();
};

/**
 * For syntaxic purpose
 */
Object.defineProperty(Type.prototype, "value", {
	get: function() { return this._value(); },
	set: function(e) {
		if(typeof e != 'function') {
			this._value = function () { return e; };
		}
		else {
			this._value = e;
		}
	}
});


/**
 * Node of Raw types
 * @param {object} obj composite object
 * @param {object} opt Type parameters
 */
function ObjectType(obj, opt) {
	Type.call(this, opt);
	this.obj = obj;
}

//inherit from type
inherits(ObjectType, Type);

/**
 * Write each sub type into stream
 * @param {Stream} s
 */
ObjectType.prototype.writeValue = function(s) {
	this.isWritten = true;
	
	for(var i in this.obj) {
		this.obj[i].write(s);
		this.isWritten = this.isWritten && this.obj[i].isWritten;
	}
};

/**
 * Read each sub type into stream
 * @param {Stream} s from read stream
 */
ObjectType.prototype.readValue = function(s) {
	this.isReaded = true;
	
	for(var i in this.obj) {
		//pass constant parameter
		if(this.opt.constant) {
			this.obj[i].opt["constant"] = true;
		}
		//pass optional parameter
		if(this.opt.optional) {
			this.obj[i].opt["optional"] = true;
		}
		this.obj[i].read(s);
		
		this.isReaded = this.isReaded && this.obj[i].isReaded;
	}
};

/**
 * Sum size of sub types
 */
ObjectType.prototype._size_ = function() {
	var size = 0;
	for(var i in this.obj) {
		size += this.obj[i].size();
	}
	return size;
};

/**
 * Leaf of tree type
 * @param {number} value of type
 * @param {function} readBufferCallback Buffer prototype read function
 * @param {function} writeBufferCallback Buffer prototype write function
 * @param {object} opt Type parameter
 */
function SingleType(value, nbBytes, readBufferCallback, writeBufferCallback, opt){
	Type.call(this, opt);
	this.value = value || 0;
	this.nbBytes = nbBytes;
	this.readBufferCallback = readBufferCallback;
	this.writeBufferCallback = writeBufferCallback;
}

//inherit from type
inherits(SingleType, Type);

/**
 * Write SingleType value into stream
 * @param s
 */
SingleType.prototype.writeValue = function(s) {
	this.writeBufferCallback.call(s.buffer, this.value, s.offset);
	s.offset += this._size_();
};

/**
 * Read SingleType value into stream
 * @param {Stream} s from read stream
 */
SingleType.prototype.readValue = function(s) {
	this.value = this.readBufferCallback.call(s.buffer, s.offset);
	s.offset += this._size_();
};

/**
 * Size of single type
 * @returns Size of single type
 */
SingleType.prototype._size_ = function() {
	return this.nbBytes;
};

/**
 * Integer on 1 byte
 * @param {number | function} value of type
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt8(value, opt) {
	SingleType.call(this, value, 1, Buffer.prototype.readUInt8, Buffer.prototype.writeUInt8, opt);
}

//inherit from type
inherits(UInt8, SingleType);

/**
 * Integer on 2 bytes in Little Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt16Le(value, opt) {
	SingleType.call(this, value, 2, Buffer.prototype.readUInt16LE, Buffer.prototype.writeUInt16LE, opt);
}

//inherit from type
inherits(UInt16Le, SingleType);

/**
 * Integer on 2 bytes in Big Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt16Be(value, opt) {
	SingleType.call(this, value, 2, Buffer.prototype.readUInt16BE, Buffer.prototype.writeUInt16BE, opt);
}

//inherit from type
inherits(UInt16Be, SingleType);

/**
 * Integer on 4 bytes in Little Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt32Le(value, opt) {
	SingleType.call(this, value, 4, Buffer.prototype.readUInt32LE, Buffer.prototype.writeUInt32LE, opt);
}

//inherit from type
inherits(UInt32Le, SingleType);

/**
 * Integer on 4 bytes in Big Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt32Be(value, opt) {
	SingleType.call(this, value, 4, Buffer.prototype.readUInt32BE, Buffer.prototype.writeUInt32BE, opt);
}

//inherit from type
inherits(UInt32Be, SingleType);

/**
 * Module exports
 */
module.exports = {
	Stream : Stream,
	ObjectType : ObjectType,
	UInt8 : UInt8,
	UInt16Le : UInt16Le,
	UInt16Be : UInt16Be,
	UInt32Le : UInt32Le,
	UInt32Be : UInt32Be
};