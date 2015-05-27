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
 * increment offset
 * @param length {integer} length of padding
 */
Stream.prototype.readPadding = function(length) {
	this.offset += length;
};

/**
 * @param value {object | function} inner value
 * @returns
 */
function CallableValue(value) {
	if(value) {
		this.value = value;
	}
}

/**
 * For syntaxic purpose
 */
Object.defineProperty(CallableValue.prototype, "value", {
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
 * Type readable or writable by binary stream
 * @param {object} opt 
 * 			.conditional {boolean} read or write type depend on conditional call
 * @returns
 */
function Type(opt) {
	CallableValue.call(this);
	this.opt = opt || {};
	this.isReaded = false;
	this.isWritten = false;
}

inherits(Type, CallableValue);

/**
 * Write type into binary stream s
 * @param {type.Stream} s binary stream
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
 * @param {type.Stream} s binary stream
 * @returns this to chain call
 */
Type.prototype.read = function(s) {
	//do not read false conditional type
	if(this.opt.conditional && !this.opt.conditional())
		return this;
	
	if(this.opt.optional && s.availableLength() < this.size())
		return this;
	
	this.isReaded = true;
	
	//constant case
	if(this.opt.constant) {
		var oldValue = this.value;
		this.readValue(s);
		if(oldValue != this.value)
			throw "NODE_RDP_CORE_TYPE_CONSTANT_VALUE_MISMATCH";
	}
	else {
		this.readValue(s);
	}
	
	return this;
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
 * Node of Raw types
 * @param {object} obj composite object
 * @param {object} opt Type parameters
 */
function Component(obj, opt) {
	Type.call(this, opt);
	this.obj = obj;
}

//inherit from type
inherits(Component, Type);

/**
 * Write each sub type into stream
 * @param {Stream} s
 */
Component.prototype.writeValue = function(s) {
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
Component.prototype.readValue = function(s) {
	this.isReaded = true;
	
	for(var i in this.obj) {
		// ignore meta information
		if(i.startsWith("__") && i.endsWith("__")) {
			continue;
		}
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
Component.prototype._size_ = function() {
	var size = 0;
	for(var i in this.obj) {
		// ignore meta information
		if(i.startsWith("__") && i.endsWith("__")) {
			continue;
		}
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
 * @param value {String} jevascript source string
 * @param opt {object} type options
 * 	.readLength {type} length for reading operation
 * @returns {type.String}
 */
function String(value, opt) {
	Type.call(this, opt);
	this.value = value || "";
}

//inherit from type
inherits(String, Type);

/**
 * Write value into string
 * @param s {type.String}
 */
String.prototype.writeValue = function(s) {
	s.write(this.value);
	s.offset += this._size_();
};

/**
 * Read string from offset to read length if specified or end of stream
 * @param s {type.String}
 */
String.prototype.readValue = function(s) {
	if(this.opt.readLength) {
		this.value = s.buffer.toString(undefined, s.offset, this.opt.readLength.value);
	}
	else {
		this.value = s.buffer.toString(undefined, s.offset);
	}
	s.offset += this._size_();
};

/**
 * @returns {integer} length of string
 */
String.prototype._size_ = function() {
	return this.value.length;
};

/**
 * Dynamic built type depend on factory function
 * @param message {object} parent object
 * @param field {string} name of object field
 * @param factory {function} factory use to built new type
 * @param opt {object}	type options
 */
function Factory(factory, opt) {
	Type.call(this, opt);
	this.factory = factory;
}

//inherit from type
inherits(Factory, Type);

/**
 * build type and write into stream
 * @param s {Stream} input stream
 */
Factory.prototype.writeValue = function(s) {
	factory(s);
};

/**
 * build type and read from stream
 * @param s {Stream} input stream
 */
Factory.prototype.readValue = function(s) {
	factory(s);
};

/**
 * must be never called
 */
Factory.prototype._size_ = function() {
	throw "NODE_RDP_CORE_TYPE_FACTORY_TYPE_HAVE_NO_SIZE";
};

/**
 * Module exports
 */
module.exports = {
	Stream : Stream,
	Component : Component,
	UInt8 : UInt8,
	UInt16Le : UInt16Le,
	UInt16Be : UInt16Be,
	UInt32Le : UInt32Le,
	UInt32Be : UInt32Be,
	String : String,
	CallableValue : CallableValue,
	Factory : Factory
};