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
var crypto = require('crypto');
var events = require('events');
var type = require('../../core').type;
var gcc = require('../t125/gcc');
var lic = require('./lic');
var cert = require('../cert');
var rsa = require('../../security').rsa;
var hexy = require('hexy');

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240579.aspx
 */
var SecurityFlag = {
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
var InfoFlag = {
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
var AfInet = {
    AfInet : 0x00002,
    AF_INET6 : 0x0017
};

/**
 * @see https://msdn.microsoft.com/en-us/library/cc240476.aspx
 */
var PerfFlag = {
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
 * @see http://msdn.microsoft.com/en-us/library/cc241992.aspx
 * @param input {Buffer} Binary data
 * @param salt {Buffer} salt for context call
 * @param salt1 {Buffer} another salt (ex : client random)
 * @param salt2 {Buffer} another salt (ex : server random)
 * @return {Buffer}
 */
function saltedHash(input, salt, salt1, salt2) {
	var sha1Digest = crypto.createHash('sha1');
	sha1Digest.update(input);
	sha1Digest.update(salt.slice(0, 48));
	sha1Digest.update(salt1);
	sha1Digest.update(salt2);
	
	var sha1Sig = sha1Digest.digest();
	
	var md5Digest = crypto.createHash('md5');
	md5Digest.update(salt.slice(0, 48));
	md5Digest.update(sha1Sig);
	return md5Digest.digest();
}

/**
 * @param key {Buffer} secret
 * @param random1 {Buffer} client random
 * @param random2 {Buffer} server random
 * @returns {Buffer}
 */
function finalHash (key, random1, random2) {
	var md5Digest = crypto.createHash('md5');
	md5Digest.update(key);
	md5Digest.update(random1);
	md5Digest.update(random2);
	return md5Digest.digest();
}

/**
 * @see http://msdn.microsoft.com/en-us/library/cc241992.aspx
 * @param secret {Buffer} secret
 * @param random1 {Buffer} client random
 * @param random2 {Buffer} server random
 * @returns {Buffer}
 */
function masterSecret (secret, random1, random2) {
	var sh1 = saltedHash(new Buffer('A'), secret, random1, random2);
	var sh2 = saltedHash(new Buffer('BB'), secret, random1, random2);
	var sh3 = saltedHash(new Buffer('CCC'), secret, random1, random2);
	
	var ms = new Buffer(sh1.length + sh2.length + sh3.length);
	sh1.copy(ms);
	sh2.copy(ms, sh1.length);
	sh3.copy(ms, sh1.length + sh2.length);
	return ms;
}

/**
 * RDP client informations
 * @param extendedInfoConditional {boolean} true if RDP5+
 * @returns {type.Component}
 */
function rdpInfos(extendedInfoConditional) {
	var self = {
		codePage : new type.UInt32Le(),
        flag : new type.UInt32Le(InfoFlag.INFO_MOUSE | InfoFlag.INFO_UNICODE | InfoFlag.INFO_LOGONNOTIFY | InfoFlag.INFO_LOGONERRORS | InfoFlag.INFO_DISABLECTRLALTDEL | InfoFlag.INFO_ENABLEWINDOWSKEY),
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
		clientAddressFamily : new type.UInt16Le(AfInet.AfInet),
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
 * Main receive function
 * @param s {type.Stream}
 */
Sec.prototype.recv = function(s) {
	// not support yet basic RDP security layer
	this.emit('data', s);
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
	this.sendFlagged(SecurityFlag.SEC_INFO_PKT, this.infos);
	var self = this;
	this.transport.once('global', function(s) {
		self.recvLicense(s);
	});
};

function reverse(buffer) {
	var result = new Buffer(buffer.length);
	for(var i = buffer.length - 1; i >= 0; i--) {
		result[i] = buffer[i];
	}
	return result;
}

/**
 * Send a valid license request
 * @param licenseRequest {object(lic.serverLicenseRequest)} license requets infos
 */
Client.prototype.sendClientNewLicenseRequest = function(licenseRequest) {
	var serverRandom = licenseRequest.serverRandom.value;
	
	// read server certificate
	var s = new type.Stream(licenseRequest.serverCertificate.obj.blobData.value);
	var certificate = cert.certificate().read(s).obj;
	var publicKey = certificate.certData.obj.getPublicKey();
	
	var clientRandom = crypto.randomBytes(32);
	var preMasterSecret = crypto.randomBytes(48);
	var mSecret = masterSecret(preMasterSecret, clientRandom, serverRandom);
	var sessionKeyBlob = masterSecret(mSecret, serverRandom, clientRandom);
	this.licenseKey = finalHash(sessionKeyBlob.slice(16, 32), clientRandom, serverRandom);
	
	var request = lic.clientNewLicenseRequest();
	request.obj.clientRandom.value = clientRandom;
	var tmp = reverse(rsa.encrypt(reverse(preMasterSecret), publicKey));
	var toto = new Buffer(tmp.length + 8);
	toto.fill(0);
	tmp.copy(toto)
	request.obj.encryptedPreMasterSecret.obj.blobData.value = toto;
	request.obj.ClientMachineName.obj.blobData.value = new Buffer('speyrefitte-VirtualBox\x00');
	request.obj.ClientUserName.obj.blobData.value = new Buffer('\x00');
	this.sendFlagged(SecurityFlag.SEC_LICENSE_PKT, lic.licensePacket(request));
};

/**
 * Send a valid license request
 * @param platformChallenge {object(lic.serverPlatformChallenge)} platform challenge
 */
Client.prototype.sendClientChallengeResponse = function(platformChallenge) {
	var serverEncryptedChallenge = platformChallenge.encryptedPlatformChallenge.obj.blobData.value;
	var toto = crypto.createCipher('rc4', this.licenseKey).update(serverEncryptedChallenge);
	console.log(toto);
}

/**
 * Receive license informations
 * @param s {type.Stream}
 */
Sec.prototype.recvLicense = function(s) {
    var header = securityHeader().read(s).obj;
    if (!(header.securityFlag.value & SecurityFlag.SEC_LICENSE_PKT)) {
    	throw new Error('NODE_RDP_PROTOCOL_PDU_SEC_BAD_LICENSE_HEADER');
    }
    
    var message = lic.licensePacket().read(s).obj;
    // i'm accepted
    if (message.bMsgtype.value == lic.MessageType.ERROR_ALERT
    		&& message.licensingMessage.obj.dwErrorCode.value == lic.ERROR_CODE.STATUS_VALID_CLIENT
    		&& message.licensingMessage.obj.dwStateTransition.value == lic.STATE_TRANSITION.ST_NO_TRANSITION) {
    	var self = this;
    	this.transport.on('global', function(s) {
    		self.recv(s);
    	});
    	return;
    }
    
    // server ask license request
    if (message.bMsgtype.value == lic.MessageType.LICENSE_REQUEST) {
    	this.sendClientNewLicenseRequest(message.licensingMessage.obj);
    }
    
    // server send challenge
    if (message.bMsgtype.value == lic.MessageType.PLATFORM_CHALLENGE) {
    	this.sendClientChallengeResponse(message.licensingMessage.obj);
    }
    
    var self = this;
    this.transport.once('global', function (s) {
		self.recvLicense(s);
	});
};

/**
 * Module exports
 */
module.exports = {
		Client : Client
};