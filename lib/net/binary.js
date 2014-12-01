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
 * Write a type object
 * @param {Type} type to write
 */
Stream.prototype.writeType = function(type) {
	type.write(this);
};

/**
 * Read a type object
 * @param {Type} type to read
 */
Stream.prototype.readType = function(type) {
	type.read(this);
};

/**
 * Write UInt8 into buffer
 * @param value
 */
Stream.prototype.writeUInt8 = function(value) {
	this.buffer.writeUInt8(value, this.offset++);
};

/**
 * Read UInt8 from buffer
 */
Stream.prototype.readUInt8 = function() {
	return this.buffer.readUInt8(this.offset++);
};

/**
 * Write UInt16Le into buffer
 * @param value
 */
Stream.prototype.writeUInt16LE = function(value) {
	this.buffer.writeUInt16LE(value, this.offset);
	this.offset += 2;
};

/**
 * Read UInt16Le from buffer
 */
Stream.prototype.readUInt16LE = function() {
	var value = this.buffer.readUInt16LE(this.offset);
	this.offset += 2;
	return value;
};

/**
 * Write UInt16Be into buffer
 * @param value
 */
Stream.prototype.writeUInt16BE = function(value) {
	this.buffer.writeUInt16BE(value, this.offset);
	this.offset += 2;
};

/**
 * Read UInt16Be from buffer
 */
Stream.prototype.readUInt16BE = function() {
	var value = this.buffer.readUInt16BE(this.offset);
	this.offset += 2;
	return value;
};

/**
 * Write UInt32Le into buffer
 * @param value
 */
Stream.prototype.writeUInt32LE = function(value) {
	this.buffer.writeUInt32LE(value, this.offset);
	this.offset += 4;
};

/**
 * Read UInt32Le from buffer
 */
Stream.prototype.readUInt32LE = function() {
	var value = this.buffer.readUInt32LE(this.offset);
	this.offset += 4;
	return value;
};

/**
 * Write UInt32Be into buffer
 * @param value
 */
Stream.prototype.writeUInt32BE = function(value) {
	this.buffer.writeUInt32BE(value, this.offset);
	this.offset += 4;
};

/**
 * Read UInt32Be from buffer
 */
Stream.prototype.readUInt32BE = function() {
	var value = this.buffer.readUInt32BE(this.offset);
	this.offset += 4;
	return value;
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
	return this._size();
};

/**
 * For synthaxic purpose
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
		s.writeType(this.obj[i]);
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
		s.readType(this.obj[i]);
		
		this.isReaded = this.isReaded && this.obj[i].isReaded;
	}
};

/**
 * Sum size of sub types
 */
ObjectType.prototype._size = function() {
	var size = 0;
	for(var i in this.obj) {
		size += this.obj[i].size();
	}
	return size;
};

/**
 * Integer on 1 byte
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt8(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(UInt8, Type);

/**
 * Write UInt8 value into stream
 * @param s
 */
UInt8.prototype.writeValue = function(s) {
	s.writeUInt8(this.value);
};

/**
 * Read UInt8 value into stream
 * @param {Stream} s from read stream
 */
UInt8.prototype.readValue = function(s) {
	this.value = s.readUInt8();
};

/**
 * return 1 (length in bytes of type)
 * @returns {Number}
 */
UInt8.prototype._size = function() {
	return 1;
};

/**
 * Integer on 2 bytes in Little Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt16Le(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(UInt16Le, Type);

/**
 * Write UInt16Le value into stream
 * @param s
 */
UInt16Le.prototype.writeValue = function(s) {
	s.writeUInt16LE(this.value);
};

/**
 * Read UInt16Le value into stream
 * @param {Stream} s from read stream
 */
UInt16Le.prototype.readValue = function(s) {
	this.value = s.readUInt16LE();
};

/**
 * return 2 (length in bytes of type)
 * @returns {Number}
 */
UInt16Le.prototype._size = function() {
	return 2;
};

/**
 * Integer on 2 bytes in Big Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt16Be(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(UInt16Be, Type);

/**
 * Write UInt16Be value into stream
 * @param s
 */
UInt16Be.prototype.writeValue = function(s) {
	s.writeUInt16BE(this.value);
};

/**
 * Read UInt16Be value into stream
 * @param {Stream} s from read stream
 */
UInt16Be.prototype.readValue = function(s) {
	this.value = s.readUInt16BE();
};

/**
 * return 2 (length in bytes of type)
 * @returns {Number}
 */
UInt16Be.prototype._size = function() {
	return 2;
};

/**
 * Integer on 4 bytes in Little Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt32Le(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(UInt32Le, Type);

/**
 * Write UInt32Le value into stream
 * @param s
 */
UInt32Le.prototype.writeValue = function(s) {
	s.writeUInt32LE(this.value);
};

/**
 * Read UInt32Le value into stream
 * @param {Stream} s from read stream
 */
UInt32Le.prototype.readValue = function(s) {
	this.value = s.readUInt32LE();
};

/**
 * return 4 (length in bytes of type)
 * @returns {Number}
 */
UInt32Le.prototype._size = function() {
	return 4;
};

/**
 * Integer on 4 bytes in Big Endian
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function UInt32Be(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(UInt32Be, Type);

/**
 * Write UInt32Be value into stream
 * @param s
 */
UInt32Be.prototype.writeValue = function(s) {
	s.writeUInt32BE(this.value);
};

/**
 * Read UInt16Be value into stream
 * @param {Stream} s from read stream
 */
UInt32Be.prototype.readValue = function(s) {
	this.value = s.readUInt32BE();
};

/**
 * return 4 (length in bytes of type)
 * @returns {Number}
 */
UInt32Be.prototype._size = function() {
	return 4;
};

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