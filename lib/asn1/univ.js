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

var spec = require('./spec');
var inherits = require('util').inherits;

/**
 * ASN.1 Universal tags
 */
var UniversalTag = {
	Boolean : 1,
	Integer : 2,
	BitString : 3,
	OctetString : 4,
	Null : 5,
	ObjectIdentifier : 6,
	ObjectDescriptor : 7,
	Enumerate : 10,
	Sequence : 16,
	Set : 17
};

/**
 * Boolean type
 * @param value {boolean} inner value
 */
function Boolean(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.Boolean));
	this.value = value || false;
}

inherits(Boolean, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {Boolean}
 */
Boolean.prototype.decode = function(s, decoder) {
	decoder.decodeBoolean(s, this);
	return this;
};

/**
 * Integer type
 * @param value {integer}
 */
function Integer(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.Integer));
	this.value = value || 0;
}

inherits(Integer, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {Integer}
 */
Integer.prototype.decode = function(s, decoder) {
	decoder.decodeInteger(s, this);
	return this;
};

/**
 * Sequence type
 * @param value {object}
 */
function Sequence(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Constructed, UniversalTag.Sequence));
	this.value = value || [];
}

inherits(Sequence, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {Sequence}
 */
Sequence.prototype.decode = function(s, decoder) {
	decoder.decodeSequence(s, this);
	return this;
};


/**
 * Enumerate type
 * @param value {integer}
 */
function Enumerate(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.Enumerate));
	this.value = value || 0;
}

inherits(Enumerate, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {Enumerate}
 */
Enumerate.prototype.decode = function(s, decoder) {
	decoder.decodeEnumerate(s, this);
	return this;
};

/**
 * OctetString type
 * @param value {Buffer}
 */
function OctetString(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.OctetString));
	this.value = value || new Buffer(0);
}

inherits(OctetString, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {OctetString}
 */
OctetString.prototype.decode = function(s, decoder) {
	decoder.decodeOctetString(s, this);
	return this;
};

/**
 * ObjectIdentifier type
 * @param value {Buffer}
 */
function ObjectIdentifier(value) {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.ObjectIdentifier));
	this.value = value || new Buffer(5);
}

inherits(ObjectIdentifier, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {ObjectIdentifier}
 */
ObjectIdentifier.prototype.decode = function(s, decoder) {
	decoder.decodeObjectIdentifier(s, this);
	return this;
};

/**
 * Null type
 */
function Null() {
	spec.Asn1Spec.call(this, new spec.Asn1Tag(spec.TagClass.Universal, spec.TagFormat.Primitive, UniversalTag.Null));
}

inherits(Null, spec.Asn1Spec);

/**
 * @param s {type.Stream}
 * @param decoder {ber.decoder}
 * @returns {Null}
 */
Null.prototype.decode = function(s, decoder) {
	decoder.decodeNull(s, this);
	return this;
};


module.exports = {
	Boolean : Boolean,
	Integer : Integer,
	Sequence : Sequence,
	Enumerate : Enumerate,
	OctetString : OctetString,
	ObjectIdentifier : ObjectIdentifier,
	Null : Null
};
