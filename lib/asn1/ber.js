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

var type = require('../core').type;

/**
 * Parse tag(T) field of BER TLV
 * And check with expected tag
 * @param s {type.Stream}
 * @param tag {spec.tag}
 * @returns {Boolean} True for valid tag matching
 */
function decodeTag(s, tag) {
	var nextTag = new type.UInt8().read(s).value;
	if (tag.tagNumber > 30) {
		nextTagNumber = new type.UInt8().read(s).value;
	}
	else {
		nextTagNumber = nextTag & 0x1F;
	}
	
	return ((nextTag & 0xE0) == (tag.tagClass | tag.tagFormat)) && (nextTagNumber == tag.tagNumber);
};

/**
 * Parse length(L) field of BER TLV
 * @param s {type.Stream}
 * @returns {integer}
 */
function decodeLength(s) {
	var size = new type.UInt8().read(s).value;
	if(size & 0x80) {
		size &= ~0x80;
		if(size == 1) {
			size = new type.UInt8().read(s).value;
		}
		else if(size == 2) {
			size = new type.UInt16Be().read(s).value;
		}
		else{
			throw 'NODE_RDP_ASN1_BER_INVALID_LENGTH';
		}
	}
	return size;
};

/**
 * Decode tuple TLV (Tag Length Value) of BER
 * @param s {type.Stream}
 * @param tag {spec.Asn1Tag} expected tag
 * @returns {type.Stream} Value of tuple
 */
function decodeElement(s, tag) {
	if (!decodeTag(s, tag)) {
		throw 'NODE_RDP_ASN1_BER_INVALID_TAG';
	}
	var length = decodeLength(s);
	
	if (length == 0) {
		return new type.Stream(0);
	}
	return new type.Stream(new type.BinaryString(null,{ readLength : new type.CallableValue(length) }).read(s).value);
};

/**
 * For context calling
 * @returns
 */
function Decoder() {
}

/**
 * Decode boolean
 * @param s {type.Stream}
 * @param boolean {univ.Boolean}
 */
Decoder.prototype.decodeBoolean = function (s, boolean) {
	boolean.value = new type.UInt8().read(decodeElement(s, boolean.tag)).value != 0;
};

/**
 * Decode Integer
 * @param s {type.Stream}
 * @param integer {univ.Integer}
 */
Decoder.prototype.decodeInteger = function (s, integer) {
	var ss = decodeElement(s, integer.tag);
	var length = ss.availableLength();
	
	for (var i = 0; i < length; i++) {
		integer.value = (integer.value << 8) + new type.UInt8().read(ss).value;
	}
};

/**
 * Decode Sequence
 * @param s {type.Stream}
 * @param sequence {univ.Sequence}
 */
Decoder.prototype.decodeSequence = function(s, sequence) {
	var ss = decodeElement(s, sequence.tag);
	for (var i in sequence.value) {
		sequence.value[i].decode(ss, this);
	}
};

/**
 * Decode enumerate
 * @param s {type.Stream}
 * @param enumerate {univ.Enumerate}
 */
Decoder.prototype.decodeEnumerate = function(s, enumerate) {
	enumerate.value = new type.UInt8().read(decodeElement(s, enumerate.tag)).value;
};

/**
 * Decode OctetString
 * @param s {type.Stream}
 * @param octetString {univ.OctetString}
 */
Decoder.prototype.decodeOctetString = function(s, octetString) {
	octetString.value = decodeElement(s, octetString.tag).buffer;
};

/**
 * Decode OctetString
 * @param s {type.Stream}
 * @param explicitTag {spec.Asn1SpecExplicitTag}
 */
Decoder.prototype.decodeExplicitTag = function(s, explicitTag) {
	var ss = decodeElement(s, explicitTag.tag);
	explicitTag.spec.decode(ss, this);
};

/**
 * Decode ObjectIdentifier
 * @param s {type.Stream}
 * @param objectIdentifier {univ.ObjectIdentifier}
 */
Decoder.prototype.decodeObjectIdentifier = function(s, objectIdentifier) {
	objectIdentifier.value = decodeElement(s, objectIdentifier.tag).buffer;
};

/**
 * Decode Null
 * @param s {type.Stream}
 * @param sequence {univ.ObjectIdentifier}
 */
Decoder.prototype.decodeNull = function(s, Null) {
	decodeElement(s, Null.tag);
};

/**
 * Module Export
 */
module.exports = {
	decoder : new Decoder()
};
