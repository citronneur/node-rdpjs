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
 * Write Int8 into buffer
 * @param value
 */
Stream.prototype.writeInt8 = function(value) {
	this.buffer.writeInt8(value, this.offset++);
};

/**
 * Read Int8 from buffer
 */
Stream.prototype.readInt8 = function() {
	return this.buffer.readInt8(this.offset++);
};

/**
 * Write UInt16Le into buffer
 * @param value
 */
Stream.prototype.writeUInt16Le = function(value) {
	this.buffer.writeUInt16Le(value, this.offset);
	this.offset += 2;
};

/**
 * Read UInt16Le from buffer
 */
Stream.prototype.readUInt16Le = function() {
	var value = this.buffer.readUInt16Le(this.offset);
	this.offset += 2;
	return value;
};

/**
 * Write UInt16Be into buffer
 * @param value
 */
Stream.prototype.writeUInt16Be = function(value) {
	this.buffer.writeUInt16Be(value, this.offset);
	this.offset += 2;
};

/**
 * Read UInt16Be from buffer
 */
Stream.prototype.readUInt16Be = function() {
	var value = this.buffer.readUInt16Be(this.offset);
	this.offset += 2;
	return value;
};

/**
 * Write UInt32Le into buffer
 * @param value
 */
Stream.prototype.writeUInt32Le = function(value) {
	this.buffer.writeUInt32Le(value, this.offset);
	this.offset += 4;
};

/**
 * Read UInt32Le from buffer
 */
Stream.prototype.readUInt32Le = function() {
	var value = this.buffer.readUInt32Le(this.offset);
	this.offset += 4;
	return value;
};

/**
 * Write UInt32Be into buffer
 * @param value
 */
Stream.prototype.writeUInt32Be = function(value) {
	this.buffer.writeUInt32Be(value, this.offset);
	this.offset += 4;
};

/**
 * Read UInt32Be from buffer
 */
Stream.prototype.readUInt32Be = function() {
	var value = this.buffer.readUInt32Be(this.offset);
	this.offset += 4;
	return value;
};

/**
 * Transform simple javascript type to closure
 * @param value
 * @returns
 */
function ToClosure(value) {
	if(typeof value != 'function') {
		value = function() { return value; };
	}
	return value;
}

/**
 * Type readable or writable by binary stream
 * @param {object} opt 
 * 			.conditional read or write type depend on conditional call
 * @returns
 */
function Type(opt) {
	this.opt = opt || {};
}

/**
 * Write type into binary stream s
 * @param {Stream} s binary stream
 */
Type.prototype.write = function(s) {
	//do not write false conditional type
	if(this.opt.conditional && !this.opt.conditional())
		return;
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
	this.readValue(s);
};

Object.defineProperty(Type.prototype, "value", {
	get: function() { return this._value(); },
	set: function(e) { this._value = ToClosure(e); }
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
	for(var i in this.obj) {
		s.writeType(this[i]);
	}
};

/**
 * Integer on 1 byte
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function Int8(value, opt) {
	Type.call(this, opt);
	this.value = value || 0;
}

//inherit from type
inherits(Int8, Type);

/**
 * Write Int8 value into stream
 * @param s
 */
Int8.prototype.writeValue = function(s) {
	s.writeInt8(this.value);
};

/**
 * Write Int8 value into stream
 * @param {Stream} s from read stream
 */
Int8.prototype.readValue = function(s) {
	this.value = s.readInt8();
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
	s.writeUInt16Le(this.value);
};

/**
 * Write UInt16Le value into stream
 * @param {Stream} s from read stream
 */
UInt16Le.prototype.readValue = function(s) {
	this.value = s.readUInt16Le();
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
	s.writeUInt16Be(this.value);
};

/**
 * Write UInt16Be value into stream
 * @param {Stream} s from read stream
 */
UInt16Be.prototype.readValue = function(s) {
	this.value = s.readUInt16Be();
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
	s.writeUInt32Le(this.value);
};

/**
 * Write UInt32Le value into stream
 * @param {Stream} s from read stream
 */
UInt32Le.prototype.readValue = function(s) {
	this.value = s.readUInt32Le();
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
	s.writeUInt32Be(this.value);
};

/**
 * Write UInt16Be value into stream
 * @param {Stream} s from read stream
 */
UInt32Be.prototype.readValue = function(s) {
	this.value = s.readUInt32Be();
};

/**
 * Module exports
 */
module.exports = {
	Stream : Stream,
	ObjectType : ObjectType,
	Int8 : Int8,
	UInt16Le : UInt16Le,
	UInt16Be : UInt16Be,
	UInt32Le : UInt32Le,
	UInt32Be : UInt32Be
};