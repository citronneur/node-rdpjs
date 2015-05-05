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
 */
function readLength(s) {
	
}