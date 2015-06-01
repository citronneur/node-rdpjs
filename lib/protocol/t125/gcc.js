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
var log = require('../../core').log;
var per = require('./per');


var t124_02_98_oid = [ 0, 0, 20, 124, 0, 1 ];
var h221_cs_key = "Duca";
var h221_sc_key = "McDn";


/**
 * @see http://msdn.microsoft.com/en-us/library/cc240509.aspx
 */
var MESSAGE_TYPE = {
    //server -> client
    SC_CORE : 0x0C01,
    SC_SECURITY : 0x0C02,
    SC_NET : 0x0C03,
    //client -> server
    CS_CORE : 0xC001,
    CS_SECURITY : 0xC002,
    CS_NET : 0xC003,
    CS_CLUSTER : 0xC004,
    CS_MONITOR : 0xC005
};
    
/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var COLOR_DEPTH = {
    RNS_UD_COLOR_8BPP : 0xCA01,
    RNS_UD_COLOR_16BPP_555 : 0xCA02,
    RNS_UD_COLOR_16BPP_565 : 0xCA03,
    RNS_UD_COLOR_24BPP : 0xCA04
};
   
/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var HIGH_COLOR = {
    HIGH_COLOR_4BPP : 0x0004,
    HIGH_COLOR_8BPP : 0x0008,
    HIGH_COLOR_15BPP : 0x000f,
    HIGH_COLOR_16BPP : 0x0010,
    HIGH_COLOR_24BPP : 0x0018
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var SUPPORT = {
    RNS_UD_24BPP_SUPPORT : 0x0001,
    RNS_UD_16BPP_SUPPORT : 0x0002,
    RNS_UD_15BPP_SUPPORT : 0x0004,
    RNS_UD_32BPP_SUPPORT : 0x0008
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var CAPABILITY_FLAG = {
    RNS_UD_CS_SUPPORT_ERRINFO_PDU : 0x0001,
    RNS_UD_CS_WANT_32BPP_SESSION : 0x0002,
    RNS_UD_CS_SUPPORT_STATUSINFO_PDU : 0x0004,
    RNS_UD_CS_STRONG_ASYMMETRIC_KEYS : 0x0008,
    RNS_UD_CS_UNUSED : 0x0010,
    RNS_UD_CS_VALID_CONNECTION_TYPE : 0x0020,
    RNS_UD_CS_SUPPORT_MONITOR_LAYOUT_PDU : 0x0040,
    RNS_UD_CS_SUPPORT_NETCHAR_AUTODETECT : 0x0080,
    RNS_UD_CS_SUPPORT_DYNVC_GFX_PROTOCOL : 0x0100,
    RNS_UD_CS_SUPPORT_DYNAMIC_TIME_ZONE : 0x0200,
    RNS_UD_CS_SUPPORT_HEARTBEAT_PDU : 0x0400
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var CONNECTION_TYPE = {
    CONNECTION_TYPE_MODEM : 0x01,
    CONNECTION_TYPE_BROADBAND_LOW : 0x02,
    CONNECTION_TYPE_SATELLITE : 0x03,
    CONNECTION_TYPE_BROADBAND_HIGH : 0x04,
    CONNECTION_TYPE_WAN : 0x05,
    CONNECTION_TYPE_LAN : 0x06,
    CONNECTION_TYPE_AUTODETECT : 0x07
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 */
var VERSION = {
    RDP_VERSION_4 : 0x00080001,
    RDP_VERSION_5_PLUS : 0x00080004
};

var SEQUENCE = {
    RNS_UD_SAS_DEL : 0xAA03
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240511.aspx
 */
var ENCRYPTION_METHOD = {
    ENCRYPTION_FLAG_40BIT : 0x00000001,
    ENCRYPTION_FLAG_128BIT : 0x00000002,
    ENCRYPTION_FLAG_56BIT : 0x00000008,
    FIPS_ENCRYPTION_FLAG : 0x00000010
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240518.aspx
 */
var ENCRYPTION_LEVEL = {
    ENCRYPTION_LEVEL_NONE : 0x00000000,
    ENCRYPTION_LEVEL_LOW : 0x00000001,
    ENCRYPTION_LEVEL_CLIENT_COMPATIBLE : 0x00000002,
    ENCRYPTION_LEVEL_HIGH : 0x00000003,
    ENCRYPTION_LEVEL_FIPS : 0x00000004
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240513.aspx
 */
var CHANNEL_OPTIONS = {
    CHANNEL_OPTION_INITIALIZED : 0x80000000,
    CHANNEL_OPTION_ENCRYPT_RDP : 0x40000000,
    CHANNEL_OPTION_ENCRYPT_SC : 0x20000000,
    CHANNEL_OPTION_ENCRYPT_CS : 0x10000000,
    CHANNEL_OPTION_PRI_HIGH : 0x08000000,
    CHANNEL_OPTION_PRI_MED : 0x04000000,
    CHANNEL_OPTION_PRI_LOW : 0x02000000,
    CHANNEL_OPTION_COMPRESS_RDP : 0x00800000,
    CHANNEL_OPTION_COMPRESS : 0x00400000,
    CHANNEL_OPTION_SHOW_PROTOCOL : 0x00200000,
    REMOTE_CONTROL_PERSISTENT : 0x00100000
};

/**
 * IBM_101_102_KEYS is the most common keyboard type
 */
var KEYBOARD_TYPE = {
    IBM_PC_XT_83_KEY : 0x00000001,
    OLIVETTI : 0x00000002,
    IBM_PC_AT_84_KEY : 0x00000003,
    IBM_101_102_KEYS : 0x00000004,
    NOKIA_1050 : 0x00000005,
    NOKIA_9140 : 0x00000006,
    JAPANESE : 0x00000007
};

/**
 * @see http://technet.microsoft.com/en-us/library/cc766503%28WS.10%29.aspx
 */
var KEYBOARD_LAYOUT = {
    ARABIC : 0x00000401,
    BULGARIAN : 0x00000402,
    CHINESE_US_KEYBOARD : 0x00000404,
    CZECH : 0x00000405,
    DANISH : 0x00000406,
    GERMAN : 0x00000407,
    GREEK : 0x00000408,
    US : 0x00000409,
    SPANISH : 0x0000040a,
    FINNISH : 0x0000040b,
    FRENCH : 0x0000040c,
    HEBREW : 0x0000040d,
    HUNGARIAN : 0x0000040e,
    ICELANDIC : 0x0000040f,
    ITALIAN : 0x00000410,
    JAPANESE : 0x00000411,
    KOREAN : 0x00000412,
    DUTCH : 0x00000413,
    NORWEGIAN : 0x00000414
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240521.aspx
 */
var CERTIFICATE_TYPE = {
    CERT_CHAIN_VERSION_1 : 0x00000001,
    CERT_CHAIN_VERSION_2 : 0x00000002
};

/**
 * @param {type.Type} data 
 * @returns {type.Component}
 */
function gccBlock(data) {
	var self = {
		// type of data block
		type : new type.UInt16Le(function() {
			return self.data.obj.__TYPE__;
		}),
		// length of entire packet
	    length : new type.UInt16Le(function() {
	    	return new type.Component(self).size();
	    }),
	    // data block
	    data : data || new type.Factory(function(s){
	    	switch(self.type.value) {
	    	case MESSAGE_TYPE.SC_CORE:
	    		self.data = ClientCoreData().read(s);
	    		break;
	    	case MESSAGE_TYPE.SC_SECURITY:
	    		break;
	    	case MESSAGE_TYPE.SC_NET:
	    		break;
	    	case MESSAGE_TYPE.CS_CORE:
	    		break;
	    	case MESSAGE_TYPE.CS_SECURITY:
	    		break;
	    	case MESSAGE_TYPE.CS_NET:
	    		break;
	    	default:
	    		log.warn("unknown GCC block type " + self.type.value);
	    		self.data = new type.String(null, { readLen : new type.CallableValue(self.length.value - 4) }).read(s);
	    	}
	    })
	};
	return new type.Component(self);
}

/**
 * Main client informations
 * 	keyboard
 * 	screen definition
 * 	color depth
 * @see http://msdn.microsoft.com/en-us/library/cc240510.aspx
 * @returns {type.Component}
 */
function clientCoreData() {
	var self = {
		__TYPE__ : MESSAGE_TYPE.CS_CORE,
		rdpVersion : new type.UInt32Le(VERSION.RDP_VERSION_5_PLUS),
		desktopWidth : new type.UInt16Le(1280),
		desktopHeight : new type.UInt16Le(800),
		colorDepth : new type.UInt16Le(COLOR_DEPTH.RNS_UD_COLOR_8BPP),
		sasSequence : new type.UInt16Le(SEQUENCE.RNS_UD_SAS_DEL),
		kbdLayout : new type.UInt32Le(KEYBOARD_LAYOUT.US),
		clientBuild : new type.UInt32Le(3790),
		clientName : new type.String("node-rdp" + Array(7 + 1).join("\x00"), { readLen : new type.CallableValue(32), unicode : true }),
		keyboardType : new type.UInt32Le(KEYBOARD_TYPE.IBM_101_102_KEYS),
		keyboardSubType : new type.UInt32Le(0),
		keyboardFnKeys : new type.UInt32Le(12),
		imeFileName : new type.String(Array(64 + 1).join("\x00"), { readLen : new type.CallableValue(64), optional : true }),
		postBeta2ColorDepth : new type.UInt16Le(COLOR_DEPTH.RNS_UD_COLOR_8BPP, { optional : true }),
		clientProductId : new type.UInt16Le(1, { optional : true }),
		serialNumber : new type.UInt32Le(0, { optional : true }),
		highColorDepth : new type.UInt16Le(HIGH_COLOR.HIGH_COLOR_24BPP, { optional : true }),
		supportedColorDepths : new type.UInt16Le(SUPPORT.RNS_UD_15BPP_SUPPORT | SUPPORT.RNS_UD_16BPP_SUPPORT | SUPPORT.RNS_UD_24BPP_SUPPORT | SUPPORT.RNS_UD_32BPP_SUPPORT, { optional : true }),
		earlyCapabilityFlags : new type.UInt16Le(CAPABILITY_FLAG.RNS_UD_CS_SUPPORT_ERRINFO_PDU, { optional : true }),
		clientDigProductId : new type.String(Array(64 + 1).join("\x00"), readLen = new type.CallableValue(64), { optional : true }),
		connectionType : new type.UInt8(0, { optional : true }),
		pad1octet : new type.UInt8(0, { optional : true }),
		serverSelectedProtocol : new type.UInt32Le(0, { optional : true })
	};
	return new type.Component(self);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240517.aspx
 * @returns {type.Component}
 */
function serverCoreData() {
	var self = {
		__TYPE__ : MESSAGE_TYPE.SC_CORE,
		rdpVersion : new type.UInt32Le(VERSION.RDP_VERSION_5_PLUS),
		clientRequestedProtocol : new type.UInt32Le({ optional : true }),
		earlyCapabilityFlags : new type.UInt32Le({ optional : true })	
	};
	return new type.Component(self);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240511.aspx
 * @returns {type.Component}
 */
function clientSecurityData() {
	var self = {
		__TYPE__ : MESSAGE_TYPE.CS_SECURITY,
		encryptionMethods : new type.UInt32Le(ENCRYPTION_METHOD.ENCRYPTION_FLAG_40BIT | ENCRYPTION_METHOD.ENCRYPTION_FLAG_56BIT | ENCRYPTION_METHOD.ENCRYPTION_FLAG_128BIT),
		extEncryptionMethods : new type.UInt32Le()
	};
	return new type.Component(self);
}

/**
 * Only use for SSL (RDP security layer TODO)
 * @see http://msdn.microsoft.com/en-us/library/cc240518.aspx
 * @returns {type.Component}
 */
function serverSecurityData() {
	var self = {
		__TYPE__ : MESSAGE_TYPE.CS_SECURITY,
		encryptionMethod : new type.UInt32Le(),
		encryptionLevel : new type.UInt32Le() 
	};
	return new type.Component(self);
}

/**
 * Client or server GCC settings block
 * @param blocks {type.Component} array of gcc blocks
 * @returns {type.Component}
 */
function settings(blocks) {
	var self = {
		blocks : blocks || new type.Factory(function(s) {
			self.blocks = new type.Component([]);
			// read until end of stream
			while(s.availableLength() > 0) {
				self.blocks.obj.push(gccBlock().read(s));
			}
		})
	};
	return new type.Component(self);
}

/**
 * Build client setting understood by node-rdp
 * @returns {type.Component} structure for client 
 */
function clientSettings() {
	return settings(new type.Component([clientCoreData(), clientSecurityData()]));
}

/**
 * Read GCC response from server
 * @param s {type.Stream} current stream
 * @returns
 */
function readConferenceCreateResponse(s) {
	per.readChoice(s);
	per.readObjectIdentifier(s, t124_02_98_oid);
	per.readLength(s);
	per.readChoice(s);
	per.readInteger16(s, 1001);
	per.readInteger(s);
	per.readEnumerates(s);
	per.readNumberOfSet(s);
	per.readChoice(s);
	if (!per.readOctetStream(s, h221_sc_key, 4))
		throw 'NODE_RDP_PROTOCOL_T125_GCC_BAD_H221_KEY';
	
	length = per.readLength(s);
	serverSettings = Settings(readLen = CallableValue(length));
	s.readType(serverSettings);
	return serverSettings;
}

/**
 * Built {type.Componen} from gcc user data
 * @param userData {type.Component} GCC data from client
 * @returns {type.Component} GCC encoded client user data
 */
function writeConferenceCreateRequest(userData) {
    var userDataStream = new type.Stream(userData.size());
    userData.write(userDataStream);
    
    return new type.Component([
	    per.writeChoice(0), per.writeObjectIdentifier(t124_02_98_oid),
	    per.writeLength(userData.size() + 14), per.writeChoice(0),
	    per.writeSelection(0x08), per.writeNumericString("1", 1), per.writePadding(1),
	    per.writeNumberOfSet(1), per.writeChoice(0xc0),
	    per.writeOctetStream(h221_cs_key, 4), per.writeOctetStream(userDataStream.toString())
    ]);
}

/**
 * Module exports
 */
module.exports = {
	clientSettings : clientSettings,
	readConferenceCreateResponse : readConferenceCreateResponse,
	writeConferenceCreateRequest : writeConferenceCreateRequest
};