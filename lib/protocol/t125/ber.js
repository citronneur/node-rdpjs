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

var type = require('../../core').type;

var BER_PC = {
	BER_PC_MASK : 0x20,
    BER_PRIMITIVE : 0x00,
    BER_CONSTRUCT : 0x20,
};

var BER_CLASS = {
    BER_CLASS_MASK : 0xC0,
    BER_CLASS_UNIV : 0x00,
    BER_CLASS_APPL : 0x40,
    BER_CLASS_CTXT : 0x80,
    BER_CLASS_PRIV : 0xC0
};
        
var BER_TAG = {
    BER_TAG_MASK : 0x1F,
    BER_TAG_BOOLEAN : 0x01,
    BER_TAG_INTEGER : 0x02,
    BER_TAG_BIT_STRING : 0x03,
    BER_TAG_OCTET_STRING : 0x04,
    BER_TAG_OBJECT_IDENFIER : 0x06,
    BER_TAG_ENUMERATED : 0x0A,
    BER_TAG_SEQUENCE : 0x10,
    BER_TAG_SEQUENCE_OF : 0x10
};

/**
 * ber constructor switch
 * @param pc{boolean}
 * @return BER_PC.BER_CONSTRUCT if pc is true BER_PC.BER_PRIMITIVE else
 */
function berPC(pc) {
	if(pc) {
		return BER_PC.BER_CONSTRUCT;
	}
	else {
		return BER_PC.BER_PRIMITIVE;
	}
}

/**
 * Read BER structure length (1,2 or 4 bytes long)
 * @param s {type.Stream} input stream
 * @returns {integer} length
 */
function readLength(s) {
	var size = null;
	length = new type.UInt8().read(s);
	var byte = length.value;
	if(byte & 0x80) {
		byte &= ~0x80;
		if(byte == 1) {
			size = new type.UInt8();
		}
		else if(byte == 2) {
			size = new type.UInt16Be();
		}
		else{
			throw "NODE_RDP_PROTOCOL_T125_BER_INVALID_LENGTH";
		}
		size.read(s);
	}
	else {
		size = length;
	}
	return size.value;
}

/**
 * 
 * @param size {integer} input value to write
 * @returns {type} BER encoded length
 */
function writeLength(size) {
    if(size > 0x7f) {
        return new type.Component([new type.UInt8(0x82), new type.UInt16Be(size)]);
    }
    else {
        return new type.UInt8(size);
    }
}
   
/**
 * @param s {type.Stream} input stream
 * @param tag {integer} expected BER tag
 * @param pc {boolean}
 * @returns {boolean} true if expected tag is read
 */
function readUniversalTag(s, tag, pc) {
    return new type.UInt8().read(s).value == ((BER_CLASS.BER_CLASS_UNIV | berPC(pc)) | (BER_TAG.BER_TAG_MASK & tag));
}

/**
 * 
 * @param tag {BER_TAG} tag to write
 * @param pc {boolean}
 * @returns {type.UInt8} BER encoded tag
 */
function writeUniversalTag(tag, pc) {
    return new type.UInt8((BER_CLASS.BER_CLASS_UNIV | berPC(pc)) | (BER_TAG.BER_TAG_MASK & tag));
}

/**
 * @param s {type.Stream}
 * @param tag {BER_TAG}
 * @returns {integer} length of application packet
 */
function readApplicationTag(s, tag) {
    var byte = new type.UInt8().read(s).value;
    if(tag > 30) {
        if(byte != ((BER_CLASS.BER_CLASS_APPL | BER_PC.BER_CONSTRUCT) | BER_TAG.BER_TAG_MASK)) {
            throw "NODE_RDP_PROTOCOL_T125_BER_INVALID_DATA";
        }
        byte = new type.UInt8().read(s).value;
        if(byte != tag) {
        	throw "NODE_RDP_PROTOCOL_T125_BER_BAD_TAG";
        }
    }
    else {
        if(byte != ((BER_CLASS.BER_CLASS_APPL | BER_PC.BER_CONSTRUCT) | (BER_TAG.BER_TAG_MASK & tag))) {
        	throw "NODE_RDP_PROTOCOL_T125_BER_INVALID_DATA";
        }
    }
        
    return readLength(s);
}

/**
 * @param tag {integer} BER packet tag
 * @param size {integer} length of packet
 * @returns {type.Component} BER encoded application tag
 */
function writeApplicationTag(tag, size) {
    if(tag > 30) {
        return new type.Component([new type.UInt8((BER_CLASS.BER_CLASS_APPL | BER_PC.BER_CONSTRUCT) | BER_TAG.BER_TAG_MASK), new type.UInt8(tag), writeLength(size)]);
    }
    else {
        return new type.Component([new type.UInt8((BER_CLASS.BER_CLASS_APPL | BER_PC.BER_CONSTRUCT) | (BER_TAG.BER_TAG_MASK & tag)), writeLength(size)]);
    }
}
   
/**
 * @param s {type.Stream}
 * @returns {boolean} BER decoded
 */
function readBoolean(s) {
    if(!readUniversalTag(s, BER_TAG.BER_TAG_BOOLEAN, false)) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_BAD_BOOLEAN_TAG";
    }
    if(readLength(s).value != 1) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_BAD_BOOLEAN_SIZE";
    }
    return Boolean(new type.UInt8().read(s).value);
}

/**
 * @param b {boolean}
 * @returns {type.Component} BER encoded boolean
 */
function writeBoolean(b) {
    return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_BOOLEAN, false), writeLength(1), new type.UInt8(b ? 0xff : 0x00)]);
}

/**
 * @param s {type.Stream}
 * @returns {integer} BER decoded integer
 */
function readInteger(s) {
    if(!readUniversalTag(s, BER_TAG.BER_TAG_INTEGER, false)) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_BAD_INTEGER_TAG";
    }
    
    var size = readLength(s);
    
    if(size == 1) {
    	return new type.UInt8().read(s).value;
    }
    else if(size == 2) {
    	return new type.UInt16Be().read(s).value;
    }
    else if(size == 3) {
        integer1 = new type.UInt8().read(s).value;
        integer2 = new type.UInt16Be().read(s).value;
        return integer2.value + (integer1.value << 16);
    }
    else if(size == 4) {
        return new type.UInt32Be().read(s).value;
    }
    else {
    	throw "NODE_RDP_PROTOCOL_T125_BER_WRONG_INTEGER_SIZE";
    }
}

/**
 * @param value {integer}
 * @returns {type.Component} BER encoded integer value
 */
function writeInteger(value) {
    if(value <= 0xff) {
        return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_INTEGER, false), writeLength(1), new type.UInt8(value)]);
    }
    else if(value <= 0xffff) {
        return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_INTEGER, false), writeLength(2), new type.UInt16Be(value)]);
    }
    else {
        return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_INTEGER, false), writeLength(4), new type.UInt32Be(value)]);
    }
}

/**
 * @param s {type.Stream}
 * @returns {string}
 */
function readOctetString(s) {
    if(!readUniversalTag(s, BER_TAG.BER_TAG_OCTET_STRING, false)) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_UNEXPECTED_BER_TAG";
    }
    return s.read(readLength(s));
}

/**
 * @param value {string}
 * @returns {type.Component} BER encoded octets string
 */
function writeOctetstring(value) {
    return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_OCTET_STRING, false), writeLength(value.length), new type.BinaryString(value)]);
}

/**
 * @param s {type.Stream}
 * @returns {integer} enum value
 */
function readEnumerated(s) {
    if(!readUniversalTag(s, BER_TAG.BER_TAG_ENUMERATED, false)) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_INVELID_TAG";
    }
    if(readLength(s) != 1) {
    	throw "NODE_RDP_PROTOCOL_T125_BER_WRONG_ENUM_SIZE";
    }
    return new type.UInt8().read(s).value;
}

/**
 * @param enumerated
 * @returns {type.Component}
 */
function writeEnumerated(enumerated) {
    return new type.Component([writeUniversalTag(BER_TAG.BER_TAG_ENUMERATED, false), writeLength(1), new type.UInt8(enumerated)]);
}

/**
 * Module exports
 */
module.exports = {
	BER_TAG : BER_TAG,
	readLength : readLength,
	writeLength : writeLength,
	readUniversalTag : readUniversalTag,
	writeUniversalTag : writeUniversalTag,
	readApplicationTag : readApplicationTag,
	writeApplicationTag : writeApplicationTag,
	readBoolean : readBoolean,
	writeBoolean : writeBoolean,
	readInteger : readInteger,
	writeInteger : writeInteger,
	readOctetString : readOctetString,
	writeOctetstring : writeOctetstring,
	readEnumerated : readEnumerated,
	writeEnumerated : writeEnumerated
};