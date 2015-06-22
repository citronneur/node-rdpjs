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

var caps = require('./caps');
var type = require('../../core').type;

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240576.aspx
 */
var PDUType = {
    PDUTYPE_DEMANDACTIVEPDU : 0x11,
    PDUTYPE_CONFIRMACTIVEPDU : 0x13,
    PDUTYPE_DEACTIVATEALLPDU : 0x16,
    PDUTYPE_DATAPDU : 0x17,
    PDUTYPE_SERVER_REDIR_PKT : 0x1A
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var PDUType2 = {
    PDUTYPE2_UPDATE : 0x02,
    PDUTYPE2_CONTROL : 0x14,
    PDUTYPE2_POINTER : 0x1B,
    PDUTYPE2_INPUT : 0x1C,
    PDUTYPE2_SYNCHRONIZE : 0x1F,
    PDUTYPE2_REFRESH_RECT : 0x21,
    PDUTYPE2_PLAY_SOUND : 0x22,
    PDUTYPE2_SUPPRESS_OUTPUT : 0x23,
    PDUTYPE2_SHUTDOWN_REQUEST : 0x24,
    PDUTYPE2_SHUTDOWN_DENIED : 0x25,
    PDUTYPE2_SAVE_SESSION_INFO : 0x26,
    PDUTYPE2_FONTLIST : 0x27,
    PDUTYPE2_FONTMAP : 0x28,
    PDUTYPE2_SET_KEYBOARD_INDICATORS : 0x29,
    PDUTYPE2_BITMAPCACHE_PERSISTENT_LIST : 0x2B,
    PDUTYPE2_BITMAPCACHE_ERROR_PDU : 0x2C,
    PDUTYPE2_SET_KEYBOARD_IME_STATUS : 0x2D,
    PDUTYPE2_OFFSCRCACHE_ERROR_PDU : 0x2E,
    PDUTYPE2_SET_ERROR_INFO_PDU : 0x2F,
    PDUTYPE2_DRAWNINEGRID_ERROR_PDU : 0x30,
    PDUTYPE2_DRAWGDIPLUS_ERROR_PDU : 0x31,
    PDUTYPE2_ARC_STATUS_PDU : 0x32,
    PDUTYPE2_STATUS_INFO_PDU : 0x36,
    PDUTYPE2_MONITOR_LAYOUT_PDU : 0x37
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var StreamId = {
    STREAM_UNDEFINED : 0x00,
    STREAM_LOW : 0x01,
    STREAM_MED : 0x02,
    STREAM_HI : 0x04
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var CompressionOrder = {
    CompressionTypeMask : 0x0F,
    PACKET_COMPRESSED : 0x20,
    PACKET_AT_FRONT : 0x40,
    PACKET_FLUSHED : 0x80
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var CompressionType = {
    PACKET_COMPR_TYPE_8K : 0x0,
    PACKET_COMPR_TYPE_64K : 0x1,
    PACKET_COMPR_TYPE_RDP6 : 0x2,
    PACKET_COMPR_TYPE_RDP61 : 0x3,
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240492.aspx
 */
var Action = {
    CTRLACTION_REQUEST_CONTROL : 0x0001,
    CTRLACTION_GRANTED_CONTROL : 0x0002,
    CTRLACTION_DETACH : 0x0003,
    CTRLACTION_COOPERATE : 0x0004
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240495.aspx
 */
var PersistentKeyListFlag = {
    PERSIST_FIRST_PDU : 0x01,
    PERSIST_LAST_PDU : 0x02
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240612.aspx
 */
var BitmapFlag = {
    BITMAP_COMPRESSION : 0x0001,
    NO_BITMAP_COMPRESSION_HDR : 0x0400
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240608.aspx
 */
var UpdateType = {
    UPDATETYPE_ORDERS : 0x0000,
    UPDATETYPE_BITMAP : 0x0001,
    UPDATETYPE_PALETTE : 0x0002,
    UPDATETYPE_SYNCHRONIZE : 0x0003
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240608.aspx
 */
var UpdateType = {
    UPDATETYPE_ORDERS : 0x0000,
    UPDATETYPE_BITMAP : 0x0001,
    UPDATETYPE_PALETTE : 0x0002,
    UPDATETYPE_SYNCHRONIZE : 0x0003
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240583.aspx
 */
var InputMessageType = {
    INPUT_EVENT_SYNC : 0x0000,
    INPUT_EVENT_UNUSED : 0x0002,
    INPUT_EVENT_SCANCODE : 0x0004,
    INPUT_EVENT_UNICODE : 0x0005,
    INPUT_EVENT_MOUSE : 0x8001,
    INPUT_EVENT_MOUSEX : 0x8002
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240586.aspx
 */
var PointerFlag = {
    PTRFLAGS_HWHEEL : 0x0400,
    PTRFLAGS_WHEEL : 0x0200,
    PTRFLAGS_WHEEL_NEGATIVE : 0x0100,
    WheelRotationMask : 0x01FF,
    PTRFLAGS_MOVE : 0x0800,
    PTRFLAGS_DOWN : 0x8000,
    PTRFLAGS_BUTTON1 : 0x1000,
    PTRFLAGS_BUTTON2 : 0x2000,
    PTRFLAGS_BUTTON3 : 0x4000
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240584.aspx
 */
var KeyboardFlag = {
    KBDFLAGS_EXTENDED : 0x0100,
    KBDFLAGS_DOWN : 0x4000,
    KBDFLAGS_RELEASE : 0x8000
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240622.aspx
 */
var FastPathUpdateType = {
    FASTPATH_UPDATETYPE_ORDERS : 0x0,
    FASTPATH_UPDATETYPE_BITMAP : 0x1,
    FASTPATH_UPDATETYPE_PALETTE : 0x2,
    FASTPATH_UPDATETYPE_SYNCHRONIZE : 0x3,
    FASTPATH_UPDATETYPE_SURFCMDS : 0x4,
    FASTPATH_UPDATETYPE_PTR_NULL : 0x5,
    FASTPATH_UPDATETYPE_PTR_DEFAULT : 0x6,
    FASTPATH_UPDATETYPE_PTR_POSITION : 0x8,
    FASTPATH_UPDATETYPE_COLOR : 0x9,
    FASTPATH_UPDATETYPE_CACHED : 0xA,
    FASTPATH_UPDATETYPE_POINTER : 0xB
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240622.aspx
 */
var FastPathOutputCompression = {
    FASTPATH_OUTPUT_COMPRESSION_USED : 0x2
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240648.aspx
 */
var Display = {
    SUPPRESS_DISPLAY_UPDATES : 0x00,
    ALLOW_DISPLAY_UPDATES : 0x01
};

/**
 * @see https://msdn.microsoft.com/en-us/library/cc240588.aspx
 */
var ToogleFlag = {
    TS_SYNC_SCROLL_LOCK : 0x00000001,
    TS_SYNC_NUM_LOCK : 0x00000002,
    TS_SYNC_CAPS_LOCK : 0x00000004,
    TS_SYNC_KANA_LOCK : 0x00000008
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240544.aspx
 */
var ErrorInfo = {
    ERRINFO_RPC_INITIATED_DISCONNECT : 0x00000001,
    ERRINFO_RPC_INITIATED_LOGOFF : 0x00000002,
    ERRINFO_IDLE_TIMEOUT : 0x00000003,
    ERRINFO_LOGON_TIMEOUT : 0x00000004,
    ERRINFO_DISCONNECTED_BY_OTHERCONNECTION : 0x00000005,
    ERRINFO_OUT_OF_MEMORY : 0x00000006,
    ERRINFO_SERVER_DENIED_CONNECTION : 0x00000007,
    ERRINFO_SERVER_INSUFFICIENT_PRIVILEGES : 0x00000009,
    ERRINFO_SERVER_FRESH_CREDENTIALS_REQUIRED : 0x0000000A,
    ERRINFO_RPC_INITIATED_DISCONNECT_BYUSER : 0x0000000B,
    ERRINFO_LOGOFF_BY_USER : 0x0000000C,
    ERRINFO_LICENSE_INTERNAL : 0x00000100,
    ERRINFO_LICENSE_NO_LICENSE_SERVER : 0x00000101,
    ERRINFO_LICENSE_NO_LICENSE : 0x00000102,
    ERRINFO_LICENSE_BAD_CLIENT_MSG : 0x00000103,
    ERRINFO_LICENSE_HWID_DOESNT_MATCH_LICENSE : 0x00000104,
    ERRINFO_LICENSE_BAD_CLIENT_LICENSE : 0x00000105,
    ERRINFO_LICENSE_CANT_FINISH_PROTOCOL : 0x00000106,
    ERRINFO_LICENSE_CLIENT_ENDED_PROTOCOL : 0x00000107,
    ERRINFO_LICENSE_BAD_CLIENT_ENCRYPTION : 0x00000108,
    ERRINFO_LICENSE_CANT_UPGRADE_LICENSE : 0x00000109,
    ERRINFO_LICENSE_NO_REMOTE_CONNECTIONS : 0x0000010A,
    ERRINFO_CB_DESTINATION_NOT_FOUND : 0x0000400,
    ERRINFO_CB_LOADING_DESTINATION : 0x0000402,
    ERRINFO_CB_REDIRECTING_TO_DESTINATION : 0x0000404,
    ERRINFO_CB_SESSION_ONLINE_VM_WAKE : 0x0000405,
    ERRINFO_CB_SESSION_ONLINE_VM_BOOT : 0x0000406,
    ERRINFO_CB_SESSION_ONLINE_VM_NO_DNS : 0x0000407,
    ERRINFO_CB_DESTINATION_POOL_NOT_FREE : 0x0000408,
    ERRINFO_CB_CONNECTION_CANCELLED : 0x0000409,
    ERRINFO_CB_CONNECTION_ERROR_INVALID_SETTINGS : 0x0000410,
    ERRINFO_CB_SESSION_ONLINE_VM_BOOT_TIMEOUT : 0x0000411,
    ERRINFO_CB_SESSION_ONLINE_VM_SESSMON_FAILED : 0x0000412,
    ERRINFO_UNKNOWNPDUTYPE2 : 0x000010C9,
    ERRINFO_UNKNOWNPDUTYPE : 0x000010CA,
    ERRINFO_DATAPDUSEQUENCE : 0x000010CB,
    ERRINFO_CONTROLPDUSEQUENCE : 0x000010CD,
    ERRINFO_INVALIDCONTROLPDUACTION : 0x000010CE,
    ERRINFO_INVALIDINPUTPDUTYPE : 0x000010CF,
    ERRINFO_INVALIDINPUTPDUMOUSE : 0x000010D0,
    ERRINFO_INVALIDREFRESHRECTPDU : 0x000010D1,
    ERRINFO_CREATEUSERDATAFAILED : 0x000010D2,
    ERRINFO_CONNECTFAILED : 0x000010D3,
    ERRINFO_CONFIRMACTIVEWRONGSHAREID : 0x000010D4,
    ERRINFO_CONFIRMACTIVEWRONGORIGINATOR : 0x000010D5,
    ERRINFO_PERSISTENTKEYPDUBADLENGTH : 0x000010DA,
    ERRINFO_PERSISTENTKEYPDUILLEGALFIRST : 0x000010DB,
    ERRINFO_PERSISTENTKEYPDUTOOMANYTOTALKEYS : 0x000010DC,
    ERRINFO_PERSISTENTKEYPDUTOOMANYCACHEKEYS : 0x000010DD,
    ERRINFO_INPUTPDUBADLENGTH : 0x000010DE,
    ERRINFO_BITMAPCACHEERRORPDUBADLENGTH : 0x000010DF,
    ERRINFO_SECURITYDATATOOSHORT : 0x000010E0,
    ERRINFO_VCHANNELDATATOOSHORT : 0x000010E1,
    ERRINFO_SHAREDATATOOSHORT : 0x000010E2,
    ERRINFO_BADSUPRESSOUTPUTPDU : 0x000010E3,
    ERRINFO_CONFIRMACTIVEPDUTOOSHORT : 0x000010E5,
    ERRINFO_CAPABILITYSETTOOSMALL : 0x000010E7,
    ERRINFO_CAPABILITYSETTOOLARGE : 0x000010E8,
    ERRINFO_NOCURSORCACHE : 0x000010E9,
    ERRINFO_BADCAPABILITIES : 0x000010EA,
    ERRINFO_VIRTUALCHANNELDECOMPRESSIONERR : 0x000010EC,
    ERRINFO_INVALIDVCCOMPRESSIONTYPE : 0x000010ED,
    ERRINFO_INVALIDCHANNELID : 0x000010EF,
    ERRINFO_VCHANNELSTOOMANY : 0x000010F0,
    ERRINFO_REMOTEAPPSNOTENABLED : 0x000010F3,
    ERRINFO_CACHECAPNOTSET : 0x000010F4,
    ERRINFO_BITMAPCACHEERRORPDUBADLENGTH2 : 0x000010F5,
    ERRINFO_OFFSCRCACHEERRORPDUBADLENGTH : 0x000010F6,
    ERRINFO_DNGCACHEERRORPDUBADLENGTH : 0x000010F7,
    ERRINFO_GDIPLUSPDUBADLENGTH : 0x000010F8,
    ERRINFO_SECURITYDATATOOSHORT2 : 0x00001111,
    ERRINFO_SECURITYDATATOOSHORT3 : 0x00001112,
    ERRINFO_SECURITYDATATOOSHORT4 : 0x00001113,
    ERRINFO_SECURITYDATATOOSHORT5 : 0x00001114,
    ERRINFO_SECURITYDATATOOSHORT6 : 0x00001115,
    ERRINFO_SECURITYDATATOOSHORT7 : 0x00001116,
    ERRINFO_SECURITYDATATOOSHORT8 : 0x00001117,
    ERRINFO_SECURITYDATATOOSHORT9 : 0x00001118,
    ERRINFO_SECURITYDATATOOSHORT10 : 0x00001119,
    ERRINFO_SECURITYDATATOOSHORT11 : 0x0000111A,
    ERRINFO_SECURITYDATATOOSHORT12 : 0x0000111B,
    ERRINFO_SECURITYDATATOOSHORT13 : 0x0000111C,
    ERRINFO_SECURITYDATATOOSHORT14 : 0x0000111D,
    ERRINFO_SECURITYDATATOOSHORT15 : 0x0000111E,
    ERRINFO_SECURITYDATATOOSHORT16 : 0x0000111F,
    ERRINFO_SECURITYDATATOOSHORT17 : 0x00001120,
    ERRINFO_SECURITYDATATOOSHORT18 : 0x00001121,
    ERRINFO_SECURITYDATATOOSHORT19 : 0x00001122,
    ERRINFO_SECURITYDATATOOSHORT20 : 0x00001123,
    ERRINFO_SECURITYDATATOOSHORT21 : 0x00001124,
    ERRINFO_SECURITYDATATOOSHORT22 : 0x00001125,
    ERRINFO_SECURITYDATATOOSHORT23 : 0x00001126,
    ERRINFO_BADMONITORDATA : 0x00001129,
    ERRINFO_VCDECOMPRESSEDREASSEMBLEFAILED : 0x0000112A,
    ERRINFO_VCDATATOOLONG : 0x0000112B,
    ERRINFO_BAD_FRAME_ACK_DATA : 0x0000112C,
    ERRINFO_GRAPHICSMODENOTSUPPORTED : 0x0000112D,
    ERRINFO_GRAPHICSSUBSYSTEMRESETFAILED : 0x0000112E,
    ERRINFO_GRAPHICSSUBSYSTEMFAILED : 0x0000112F,
    ERRINFO_TIMEZONEKEYNAMELENGTHTOOSHORT : 0x00001130,
    ERRINFO_TIMEZONEKEYNAMELENGTHTOOLONG : 0x00001131,
    ERRINFO_DYNAMICDSTDISABLEDFIELDMISSING : 0x00001132,
    ERRINFO_VCDECODINGERROR : 0x00001133,
    ERRINFO_UPDATESESSIONKEYFAILED : 0x00001191,
    ERRINFO_DECRYPTFAILED : 0x00001192,
    ERRINFO_ENCRYPTFAILED : 0x00001193,
    ERRINFO_ENCPKGMISMATCH : 0x00001194,
    ERRINFO_DECRYPTFAILED2 : 0x00001195
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240576.aspx
 * @param length {integer} length of entire pdu packet
 * @param pduType {PDUType.*} type of pdu packet
 * @param userId {integer}
 * @param opt {object} type option
 * @returns {type.Component}
 */
function shareControlHeader(length, pduType, userId, opt) {
	var self = {
		totalLength : new type.UInt16Le(length),
        pduType : new type.UInt16Le(pduType),
        // for xp sp3 and deactiveallpdu PDUSource may not be present
        PDUSource : new type.UInt16Le(userId, { optional : true })
	};
	
	return new type.Component(self, opt);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 * @param length {integer} lezngth of entire packet
 * @param pduType2 {PDUType2.*} sub PDU type 
 * @param shareId {integer} global layer id
 * @param opt {object} type option
 * @returns {type.Component}
 */
function shareDataHeader(length, pduType2, shareId, opt) {
	var self = {
		shareId : new type.UInt32Le(shareId),
        pad1 : new type.UInt8(),
        streamId : new type.UInt8(StreamId.STREAM_LOW),
        uncompressedLength : new type.UInt16Le(function() {
        	return length - 8;
        }),
        pduType2 : new type.UInt8(pduType2),
        compressedType : new type.UInt8(),
        compressedLength : new type.UInt16Le()
	};
	
	return new type.Component(self, opt);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240485.aspx
 * @param capabilities {type.Component} capabilities array
 * @param opt {object} type option
 * @returns {type.Component}
 */
function demandActivePDU(capabilities, opt) {
	var self = {
		__PDUTYPE__ : PDUType.PDUTYPE_DEMANDACTIVEPDU,
		shareId : new type.UInt32Le(),
        lengthSourceDescriptor : new type.UInt16Le(function() {
        	return self.sourceDescriptor.size();
        }),
        lengthCombinedCapabilities : new type.UInt16Le(function() {
        	return self.numberCapabilities.size() + self.pad2Octets.size() + self.capabilitySets.size();
        }),
        sourceDescriptor : new type.BinaryString(new Buffer('node-rdp', 'binary'), { readLength : new type.CallableValue(function() {
        	return self.lengthSourceDescriptor.value
        }) }),
        numberCapabilities : new type.UInt16Le(function() {
        	return self.capabilitySets.obj.length;
        }),
        pad2Octets : new type.UInt16Le(),
        capabilitySets : capabilities || new type.Factory(function(s) {
        	self.capabilitySets = new type.Component([]);
        	for(var i = 0; i < self.numberCapabilities.value; i++) {
        		self.capabilitySets.obj.push(caps.capability().read(s))
        	}
        }),
        sessionId : new type.UInt32Le()
	};
	
	return new type.Component(self, opt);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240488.aspx
 * @param capabilities {type.Component} capabilities array
 * @param shareId {integer} session id
 * @param opt {object} type option
 * @returns {type.Component}
 */
function confirmActivePDU(capabilities, shareId, opt) {
	var self = {
		__PDUTYPE__ : PDUType.PDUTYPE_CONFIRMACTIVEPDU,
		shareId : new type.UInt32Le(shareId),
        originatorId : new type.UInt16Le(0x03EA, { constant : true }),
        lengthSourceDescriptor : new type.UInt16Le(function() {
        	return self.sourceDescriptor.size();
        }),
        lengthCombinedCapabilities : new type.UInt16Le(function() {
        	return self.numberCapabilities.size() + self.pad2Octets.size() + self.capabilitySets.size();
        }),
        sourceDescriptor : new type.BinaryString(new Buffer('rdpy', 'binary'), { readLength : new type.CallableValue(function() {
        	return self.lengthSourceDescriptor.value
        }) }),
        numberCapabilities : new type.UInt16Le(function() {
        	return self.capabilitySets.obj.length;
        }),
        pad2Octets : new type.UInt16Le(),
        capabilitySets : capabilities || new type.Factory(function(s) {
        	self.capabilitySets = new type.Component([]);
        	for(var i = 0; i < self.numberCapabilities.value; i++) {
        		self.capabilitySets.obj.push(caps.capability().read(s))
        	}
        })
	};
	
	return new type.Component(self, opt);
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240536.aspx
 * @param opt {object} type option
 * @returns {type.Component}
 */
function deactiveAllPDU(opt) {
	var self = {
		__PDUTYPE__ : PDUType.PDUTYPE_DEACTIVATEALLPDU,
		shareId : new type.UInt32Le(),
        lengthSourceDescriptor : new type.UInt16Le(function() {
        	return self.sourceDescriptor.size();
        }),
        sourceDescriptor : new type.BinaryString(new Buffer('rdpy', 'binary'), { readLength : self.lengthSourceDescriptor })
	};
	
	return new type.Component(self, opt);
}

/**
 * @param userId {integer}
 * @param pduMessage {type.Component} pdu message
 * @param opt {object} type option
 * @returns {type.Component}
 */
function pdu(userId, pduMessage, opt) {
	var self = {
		shareControlHeader : shareControlHeader(function() {
			return new type.Component(self).size();
		}, function() {
			return pduMessage.obj.__PDUTYPE__;
		}, userId),
		pduMessage : pduMessage || new type.Factory(function(s) {
			switch(self.shareControlHeader.obj.pduType.value) {
			case PDUType.PDUTYPE_DEMANDACTIVEPDU:
				self.pduMessage = demandActivePDU(null, { readLength : new type.CallableValue(function() {
					return self.shareControlHeader.obj.totalLength.value - self.shareControlHeader.size();
				}) }).read(s);
				break;
			case PDUType.PDUTYPE_CONFIRMACTIVEPDU:
				self.pduMessage = confirmActivePDU(null, { readLength : new type.CallableValue(function() {
					return self.shareControlHeader.obj.totalLength.value - self.shareControlHeader.size();
				}) }).read(s);
				break;
			case PDUType.PDUTYPE_DEACTIVATEALLPDU:
				self.pduMessage = deactiveAllPDU({ readLength : new type.CallableValue(function() {
					return self.shareControlHeader.obj.totalLength.value - self.shareControlHeader.size();
				}) }).read(s);
				break;
			default:
				log.debug('unknown pdu type ' + self.shareControlHeader.obj.pduType.value);
			}
		})
	};
	
	return new type.Component(self, opt);
}

/**
 * Module exports
 */
module.exports = {
		PDUType : PDUType,
		PDUType2 : PDUType2,
		StreamId : StreamId,
		CompressionOrder : CompressionOrder,
		CompressionType : CompressionType,
		Action : Action,
		PersistentKeyListFlag : PersistentKeyListFlag,
		BitmapFlag : BitmapFlag,
		UpdateType : UpdateType,
		InputMessageType : InputMessageType,
		PointerFlag : PointerFlag,
		KeyboardFlag : KeyboardFlag,
		FastPathOutputCompression : FastPathOutputCompression,
		Display : Display,
		ToogleFlag : ToogleFlag,
		ErrorInfo : ErrorInfo,
		shareControlHeader : shareControlHeader,
		shareDataHeader : shareDataHeader,
		demandActivePDU : demandActivePDU,
		confirmActivePDU : confirmActivePDU,
		deactiveAllPDU : deactiveAllPDU,
		pdu : pdu
};