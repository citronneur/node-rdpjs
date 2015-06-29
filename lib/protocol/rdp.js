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

var net = require('net');
var inherits = require('util').inherits;
var events = require('events');
var layer = require('../core').layer;
var error = require('../core').error;
var log = require('../core').log;
var TPKT = require('./tpkt');
var x224 = require('./x224');
var t125 = require('./t125');
var pdu = require('./pdu');

/**
 * Main RDP module
 */
function RdpClient(config) {
	config = config || {};
	this.connected = false;
	this.bufferLayer = new layer.BufferLayer(new net.Socket());
	this.tpkt = new TPKT(this.bufferLayer);
	this.x224 = new x224.Client(this.tpkt);
	this.mcs = new t125.mcs.Client(this.x224);
	this.sec = new pdu.sec.Client(this.mcs);
	this.global = new pdu.global.Client(this.sec);
	
	// credentials
	if (config.domain) {
		this.sec.infos.obj.domain.value = new Buffer(config.domain + '\x00', 'ucs2');
	}
	if (config.userName) {
		this.sec.infos.obj.userName.value = new Buffer(config.userName + '\x00', 'ucs2');
	}
	if (config.password) {
		this.sec.infos.obj.password.value = new Buffer(config.password + '\x00', 'ucs2');
	}
	
	if (config.enablePerf) {
		this.sec.infos.obj.extendedInfo.obj.performanceFlags.value = 
				pdu.sec.PerfFlag.PERF_DISABLE_WALLPAPER 
			| 	pdu.sec.PerfFlag.PERF_DISABLE_MENUANIMATIONS 
			| 	pdu.sec.PerfFlag.PERF_DISABLE_CURSOR_SHADOW 
			| 	pdu.sec.PerfFlag.PERF_DISABLE_THEMING 
			| 	pdu.sec.PerfFlag.PERF_DISABLE_FULLWINDOWDRAG;
	}
	
	if (config.autoLogin) {
		this.sec.infos.obj.flag.value |= pdu.sec.InfoFlag.INFO_AUTOLOGON;
	}
	
	if (config.screen && config.screen.width && config.screen.height) {
		this.mcs.clientCoreData.obj.desktopWidth.value = config.screen.width;
		this.mcs.clientCoreData.obj.desktopHeight.value = config.screen.height;
	}
	
	//bind all events
	var self = this;
	this.global.on('connect', function () {
		self.connected = true;
		self.emit('connect');
	}).on('session', function () {
		self.emit('session');
	}).on('close', function () {
		self.connected = false;
		self.emit('close');
	}).on('bitmap', function (bitmaps) {
		for(var bitmap in bitmaps) {
			self.emit('bitmap', { 
				destTop : bitmaps[bitmap].obj.destTop.value,
				destLeft : bitmaps[bitmap].obj.destLeft.value, 
				destBottom : bitmaps[bitmap].obj.destBottom.value, 
				destRight : bitmaps[bitmap].obj.destRight.value, 
				width : bitmaps[bitmap].obj.width.value,
				height : bitmaps[bitmap].obj.height.value,
				bitsPerPixel : bitmaps[bitmap].obj.bitsPerPixel.value,
				isCompress : bitmaps[bitmap].obj.flags.value & pdu.data.BitmapFlag.BITMAP_COMPRESSION,
				data : bitmaps[bitmap].obj.bitmapDataStream.value
			});
		}
	}).on('error', function (err) {
		log.error(err.code + '(' + err.message + ')\n' + err.stack);
		if (err instanceof error.FatalError) {
			throw err;
		}
		else {
			self.emit('error', err);
		}
	});
}

//inherit from Layer
inherits(RdpClient, events.EventEmitter);

/**
 * Connect RDP client
 * @param host {string} destination host
 * @param port {integer} destination port
 */
RdpClient.prototype.connect = function (host, port) {
	log.info('connect to ' + host + ':' + port);
	var self = this;
	this.bufferLayer.socket.connect(port, host, function () {
		// in client mode connection start from x224 layer
		self.x224.connect();
	});
	return this;
};

/**
 * Close RDP client
 */
RdpClient.prototype.close = function () {
	if(this.connected) {
		this.global.close();
	}
	this.connected = false;
	return this;
};

/**
 * Send pointer event to server
 * @param x {integer} mouse x position
 * @param y {integer} mouse y position
 * @param button {integer} button number of mouse
 * @param isPressed {boolean} state of button
 */
RdpClient.prototype.sendPointerEvent = function (x, y, button, isPressed) {
	if (!this.connected)
		return;
	var event = pdu.data.pointerEvent();
	if (isPressed) {
		event.obj.pointerFlags.value |= pdu.data.PointerFlag.PTRFLAGS_DOWN;
	}
	
	switch(button) {
	case 1:
		event.obj.pointerFlags.value |= pdu.data.PointerFlag.PTRFLAGS_BUTTON1;
		break;
	case 2:
		event.obj.pointerFlags.value |= pdu.data.PointerFlag.PTRFLAGS_BUTTON2;
		break;
	case 3:
		event.obj.pointerFlags.value |= pdu.data.PointerFlag.PTRFLAGS_BUTTON3
		break;
	default:
		event.obj.pointerFlags.value |= pdu.data.PointerFlag.PTRFLAGS_MOVE;
	}
	
    event.obj.xPos.value = x;
    event.obj.yPos.value = y;
    
    this.global.sendInputEvents([event]);
};

/**
 * send scancode event
 * @param code {integer}
 * @param isPressed {boolean}
 * @param extended {boolenan} extended keys
 */
RdpClient.prototype.sendKeyEventScancode = function (code, isPressed, extended) {
	if (!this.connected)
		return;
	extended = extended || false;
	var event = pdu.data.scancodeKeyEvent();
	event.obj.keyCode.value = code;
	
	if (!isPressed) {
		event.obj.keyboardFlags.value |= pdu.data.KeyboardFlag.KBDFLAGS_RELEASE;
	}
    
    if (extended) {
    	event.obj.keyboardFlags.value |= pdu.data.KeyboardFlag.KBDFLAGS_EXTENDED;
    }
    
    this.global.sendInputEvents([event]);
};

function createClient(config) {
	return new RdpClient(config);
};

/**
 * Module exports
 */
module.exports = {
		createClient : createClient
};