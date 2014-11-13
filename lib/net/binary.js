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

Stream.prototype.writeInt8 = function(value) {
	this.buffer.writeInt8(value, this.offset++);
};

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
 * Integer on 1 byte
 * @param {number | function} value to write or compare if constant
 * @param {object} opt	Type parameter
 * @returns
 */
function Int8(value, opt) {
	Type.call(this, opt);
	this.value = ToClosure(value);
}

//inherit from type
inherits(Int8, Type);

/**
 * Write Int8 value into stream
 * @param s
 */
Int8.prototype.writeValue = function(s) {
	s.writeInt8(this.value());
};

/**
 * Module exports
 */
module.exports = {
	Stream : Stream,
	CompositeType : CompositeType,
	Int8 : Int8
};