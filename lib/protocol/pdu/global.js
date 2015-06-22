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
var caps = require('./caps');
var data = require('./data');
var type = require('../../core').type;

/**
 * Global channel for all graphic updates
 * capabilities exchange and input handles
 */
function Global(transport) {
	this.transport = transport;
	// must be init via connect event
	this.userId = 0;
	this.serverCapabilities = [];
	this.clientCapabilities = [];
}

//inherit from Layer
inherits(Global, events.EventEmitter);

/**
 * Send formated PDU message
 * @param message {type.Component} PDU message
 */
Global.prototype.sendPDU = function(message) {
	this.transport.send(data.pdu(this.userId, message));
};

/**
 * Client side of Global channel automata
 * @param transport
 */
function Client(transport) {
	Global.call(this, transport);
	var self = this;
	this.transport.once('connect', function(core, userId) {
		self.connect(core, userId);
	});
	
	// init client capabilities
	this.clientCapabilities[caps.CapsType.CAPSTYPE_GENERAL] = caps.generalCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_BITMAP] = caps.bitmapCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_ORDER] = caps.orderCapability(
			new type.Component([
			     new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0),
			     new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0),
			     new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0),
			     new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0), new type.UInt8(0)
			 ]));
	this.clientCapabilities[caps.CapsType.CAPSTYPE_BITMAPCACHE] = caps.bitmapCacheCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_POINTER] = caps.pointerCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_INPUT] = caps.inputCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_BRUSH] = caps.brushCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_GLYPHCACHE] = caps.glyphCapability(new type.Component([]));
	this.clientCapabilities[caps.CapsType.CAPSTYPE_OFFSCREENCACHE] = caps.offscreenBitmapCacheCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_VIRTUALCHANNEL] = caps.virtualChannelCapability();
	this.clientCapabilities[caps.CapsType.CAPSTYPE_SOUND] = caps.soundCapability();
	this.clientCapabilities[caps.CapsType.CAPSETTYPE_MULTIFRAGMENTUPDATE] = caps.multiFragmentUpdate();
}

// inherit from Layer
inherits(Client, Global);

/**
 * connect function
 * @param gccCore {type.Component(clientCoreData)}
 */
Client.prototype.connect = function(gccCore, userId) {
	this.gccCore = gccCore;
	this.userId = userId;
	var self = this;
	this.transport.once('data', function(s) {
		self.recvDemandActivePDU(s);
	});
};

/**
 * Receive capabilities from server
 * @param s {type.Stream}
 */
Client.prototype.recvDemandActivePDU = function(s) {
	var pdu = data.pdu().read(s);
	if (pdu.obj.shareControlHeader.obj.pduType.value != data.PDUType.PDUTYPE_DEMANDACTIVEPDU) {
		log.debug('ignore message type ' + pdu.obj.shareContyrolHeader.obj.pduType.value + ' during connection sequence');
		var self = this;
		this.transport.once('global', function(s) {
			self.recvDemandActivePDU(s);
		});
		return;
	}
	
	// store share id
	this.sharedId = pdu.obj.pduMessage.obj.shareId.value;
	
	// store server capabilities
	for(var i in pdu.obj.pduMessage.obj.capabilitySets.obj) {
		var cap = pdu.obj.pduMessage.obj.capabilitySets.obj[i].obj.capability;
		if(!cap.obj) {
			continue;
		}
		this.serverCapabilities[cap.obj.__TYPE__] = cap;
	}
	
	this.transport.enableSecureCheckSum = !!(this.serverCapabilities[caps.CapsType.CAPSTYPE_GENERAL].obj.extraFlags.value & caps.GeneralExtraFlag.ENC_SALTED_CHECKSUM);
	
	this.sendConfirmActivePDU();
};

Client.prototype.sendConfirmActivePDU = function() {
	var generalCapability = this.clientCapabilities[caps.CapsType.CAPSTYPE_GENERAL].obj;
	generalCapability.osMajorType.value = caps.MajorType.OSMAJORTYPE_WINDOWS;
	generalCapability.osMinorType.value = caps.MinorType.OSMINORTYPE_WINDOWS_NT;
	generalCapability.extraFlags.value = 	caps.GeneralExtraFlag.LONG_CREDENTIALS_SUPPORTED 
										| 	caps.GeneralExtraFlag.NO_BITMAP_COMPRESSION_HDR 
										| 	caps.GeneralExtraFlag.ENC_SALTED_CHECKSUM
										|	caps.GeneralExtraFlag.FASTPATH_OUTPUT_SUPPORTED;
	
	var bitmapCapability = this.clientCapabilities[caps.CapsType.CAPSTYPE_BITMAP].obj;
	bitmapCapability.preferredBitsPerPixel.value = this.gccCore.highColorDepth.value;
    bitmapCapability.desktopWidth.value = this.gccCore.desktopWidth.value;
    bitmapCapability.desktopHeight.value = this.gccCore.desktopHeight.value;
    
    var inputCapability = this.clientCapabilities[caps.CapsType.CAPSTYPE_INPUT].obj;
    inputCapability.inputFlags.value = caps.InputFlags.INPUT_FLAG_SCANCODES | caps.InputFlags.INPUT_FLAG_MOUSEX | caps.InputFlags.INPUT_FLAG_UNICODE;
    inputCapability.keyboardLayout = this.gccCore.kbdLayout;
    inputCapability.keyboardType = this.gccCore.keyboardType;
    inputCapability.keyboardSubType = this.gccCore.keyboardSubType;
    inputCapability.keyboardrFunctionKey = this.gccCore.keyboardFnKeys;
    inputCapability.imeFileName = this.gccCore.imeFileName;
    
    var capabilities = new type.Component([]);
    for(var i in this.clientCapabilities) {
    	capabilities.obj.push(caps.capability(this.clientCapabilities[i]));
    }
    
    var confirmActivePDU = data.confirmActivePDU(capabilities, this.shareId);
    
    this.sendPDU(confirmActivePDU);
};

/**
 * Module exports
 */
module.exports = {
	Client : Client
};