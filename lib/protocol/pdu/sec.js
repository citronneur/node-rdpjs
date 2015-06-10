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
var events = require('events');
var type = require('../../core').type;
var gcc = require('../t125/gcc');
var lic = require('./lic');

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240579.aspx
 */
var SECURITY_FLAG = {
    SEC_EXCHANGE_PKT : 0x0001,
    SEC_TRANSPORT_REQ : 0x0002,
    RDP_SEC_TRANSPORT_RSP : 0x0004,
    SEC_ENCRYPT : 0x0008,
    SEC_RESET_SEQNO : 0x0010,
    SEC_IGNORE_SEQNO : 0x0020,
    SEC_INFO_PKT : 0x0040,
    SEC_LICENSE_PKT : 0x0080,
    SEC_LICENSE_ENCRYPT_CS : 0x0200,
    SEC_LICENSE_ENCRYPT_SC : 0x0200,
    SEC_REDIRECTION_PKT : 0x0400,
    SEC_SECURE_CHECKSUM : 0x0800,
    SEC_AUTODETECT_REQ : 0x1000,
    SEC_AUTODETECT_RSP : 0x2000,
    SEC_HEARTBEAT : 0x4000,
    SEC_FLAGSHI_VALID : 0x8000
};

/**
 * @see https://msdn.microsoft.com/en-us/library/cc240475.aspx
 */
var INFO_FLAG = {
    INFO_MOUSE : 0x00000001,
    INFO_DISABLECTRLALTDEL : 0x00000002,
    INFO_AUTOLOGON : 0x00000008,
    INFO_UNICODE : 0x00000010,
    INFO_MAXIMIZESHELL : 0x00000020,
    INFO_LOGONNOTIFY : 0x00000040,
    INFO_COMPRESSION : 0x00000080,
    INFO_ENABLEWINDOWSKEY : 0x00000100,
    INFO_REMOTECONSOLEAUDIO : 0x00002000,
    INFO_FORCE_ENCRYPTED_CS_PDU : 0x00004000,
    INFO_RAIL : 0x00008000,
    INFO_LOGONERRORS : 0x00010000,
    INFO_MOUSE_HAS_WHEEL : 0x00020000,
    INFO_PASSWORD_IS_SC_PIN : 0x00040000,
    INFO_NOAUDIOPLAYBACK : 0x00080000,
    INFO_USING_SAVED_CREDS : 0x00100000,
    INFO_AUDIOCAPTURE : 0x00200000,
    INFO_VIDEO_DISABLE : 0x00400000,
    INFO_CompressionTypeMask : 0x00001E00
};

/**
 * @see https://msdn.microsoft.com/en-us/library/cc240476.aspx
 */
var AF_INET = {
    AF_INET : 0x00002,
    AF_INET6 : 0x0017
};

/**
 * @see https://msdn.microsoft.com/en-us/library/cc240476.aspx
 */
var PERF_FLAG = {
    PERF_DISABLE_WALLPAPER : 0x00000001,
    PERF_DISABLE_FULLWINDOWDRAG : 0x00000002,
    PERF_DISABLE_MENUANIMATIONS : 0x00000004,
    PERF_DISABLE_THEMING : 0x00000008,
    PERF_DISABLE_CURSOR_SHADOW : 0x00000020,
    PERF_DISABLE_CURSORSETTINGS : 0x00000040,
    PERF_ENABLE_FONT_SMOOTHING : 0x00000080,
    PERF_ENABLE_DESKTOP_COMPOSITION : 0x00000100
};

/**
 * RDP client informations
 * @param extendedInfoConditional {boolean} true if RDP5+
 * @returns {type.Component}
 */
function rdpInfos(extendedInfoConditional) {
	var self = {
		codePage : new type.UInt32Le(),
        flag : new type.UInt32Le(INFO_FLAG.INFO_MOUSE | INFO_FLAG.INFO_UNICODE | INFO_FLAG.INFO_LOGONNOTIFY | INFO_FLAG.INFO_LOGONERRORS | INFO_FLAG.INFO_DISABLECTRLALTDEL | INFO_FLAG.INFO_ENABLEWINDOWSKEY),
        cbDomain : new type.UInt16Le(function() {
        	return self.domain.size() - 2;
        }),
        cbUserName : new type.UInt16Le(function() {
        	return self.userName.size() - 2;
        }),
        cbPassword : new type.UInt16Le(function() {
        	return self.password.size() - 2;
        }),
        cbAlternateShell : new type.UInt16Le(function() {
        	return self.alternateShell.size() - 2;
        }),
        cbWorkingDir : new type.UInt16Le(function() {
        	return self.workingDir.size() - 2;
        }),
        domain : new type.BinaryString(new Buffer('\x00', 'ucs2'),{ readLength : new type.CallableValue(function() {
        	return self.cbDomain.value + 2;
        })}),
        userName : new type.BinaryString(new Buffer('\x00', 'ucs2'), { readLength : new type.CallableValue(function() {
        	return self.cbUserName.value + 2;
        })}),
        password : new type.BinaryString(new Buffer('\x00', 'ucs2'), { readLength : new type.CallableValue(function () {
        	return self.cbPassword.value + 2;
        })}),
        alternateShell : new type.BinaryString(new Buffer('\x00', 'ucs2'), { readLength : new type.CallableValue(function() {
        	return self.cbAlternateShell.value + 2;
        })}),
        workingDir : new type.BinaryString(new Buffer('\x00', 'ucs2'), { readLength : new type.CallableValue(function() {
        	return self.cbWorkingDir.value + 2;
        })}),
        extendedInfo : rdpExtendedInfos({ conditional : extendedInfoConditional })
	};
	
	return new type.Component(self);
}

/**
 * RDP client extended informations present in RDP5+
 * @param opt
 * @returns {type.Component}
 */
function rdpExtendedInfos(opt) {
	var self = {
		clientAddressFamily : new type.UInt16Le(AF_INET.AF_INET),
	    cbClientAddress : new type.UInt16Le(function() {
        	return self.clientAddress.size();
        }),
	    clientAddress : new type.BinaryString(new Buffer('\x00', 'ucs2'),{ readLength : new type.CallableValue(function() {
	    	return self.cbClientAddress;
	    }) }),
	    cbClientDir : new type.UInt16Le(function() {
        	return self.clientDir.size();
        }),
	    clientDir : new type.BinaryString(new Buffer('\x00', 'ucs2'), { readLength : new type.CallableValue(function() {
	    	return self.cbClientDir;
	    }) }),
	    clientTimeZone : new type.BinaryString(new Buffer(Array(172 + 1).join("\x00"))),
	    clientSessionId : new type.UInt32Le(),
	    performanceFlags : new type.UInt32Le()
	};
	return new type.Component(self, opt);
}

/**
 * Header of security header
 * @returns {type.Component}
 */
function securityHeader() {
	var self = {
		securityFlag : new type.UInt16Le(),
		securityFlagHi : new type.UInt16Le()
	};
	
	return new type.Component(self);
}

/**
 * Security layer
 * @param transport {events.EventEmitter}
 */
function Sec(transport) {
	this.transport = transport;
	// init at connect event from transport layer
	this.gccClient = null;
	this.gccServer = null;
	var self = this;
	this.infos = rdpInfos(function() {
		return self.gccClient.core.rdpVersion.value == gcc.VERSION.RDP_VERSION_5_PLUS;
	});
};

//inherit from Layer
inherits(Sec, events.EventEmitter);

/**
 * Send message with security header
 * @param flag {integer} security flag
 * @param data {type.*} message
 */
Sec.prototype.sendFlagged = function(flag, data) {
    this.transport.send('global', new type.Component([
	    new type.UInt16Le(flag), 
	    new type.UInt16Le(), 
	    data
	]));
};

/**
 * Receive license informations
 * @param s {type.Stream}
 */
Sec.prototype.recvLicense = function(s) {
    var header = securityHeader().read(s).obj;
    if (!(header.securityFlag.value & SECURITY_FLAG.SEC_LICENSE_PKT)) {
    	throw 'NODE_RDP_PROTOCOL_PDU_SEC_BAD_LICENSE_HEADER';
    }
    
    var message = lic.licensePacket().read(s).licensingMessage;
    
};

/**
 * Client security layer
 * @param transport {events.EventEmitter}
 */
function Client(transport) {
	Sec.call(this, transport);
	var self = this;
	this.transport.on('connect', function(gccClient, gccServer) {
		self.connect(gccClient, gccServer);
	});
};

//inherit from Layer
inherits(Client, Sec);

/**
 * Connect event
 */
Client.prototype.connect = function(gccClient, gccServer) {
	//init gcc information
	this.gccClient = gccClient;
	this.gccServer = gccServer;
	this.sendInfoPkt();
};

/**
 * Send main information packet
 * VIP (very important packet) because contain credentials
 */
Client.prototype.sendInfoPkt = function() {
	this.sendFlagged(SECURITY_FLAG.SEC_INFO_PKT, this.infos);
	var self = this;
	this.transport.once('global', function(s) {
		self.recvLicense(s);
	});
};

/**
 * Module exports
 */
module.exports = {
		Client : Client
};