/**
 * Original: https://gist.github.com/TooTallNate/848444
 * Adapted: https://github.com/andris9/rai/blob/master/lib/starttls.js
 *
 * @overview
 * @author Matthew Caruana Galizia <m@m.cg>
 * @author Andris Reinman <andris.reinman@gmail.com>
 * @author Nathan Rajlich <nathan@tootallnate.net>
 * @copyright Copyright (c) 2012, Andris Reinman
 * @copyright Copyright (c) 2011, Nathan Rajlich
 * @license MIT
 * @preserve
 */

'use strict';

/*jshint node:true*/
/*global exports:true*/

var net = require('net');
var tls = require('tls');
var crypto = require('crypto');

module.exports = exports = function(options, onSecure) {
	var socket, securePair;

	if (options instanceof net.Socket) {
		socket = options;
		options = {
			socket: socket
		};
	} else if (options.socket) {
		socket = options.socket;
	} else {
		socket = options.socket = net.createConnection(options);
	}

	if (options.pair) {
		securePair = options.pair;
	} else {
		securePair = tls.createSecurePair(crypto.createCredentials(), false);
		options.pair = securePair;
	}

	// In Node < 0.9.0, socket.readable is undefined.
	if (socket.readable || undefined === socket.readable) {
		return startTls(options, onSecure);
	}

	// In Node > 0.9.0, if the socket is still unconnected then wait for connect.
	socket.once('connect', function() {
		startTls(options, onSecure);
	});

	return securePair;
};

exports.startTls = function(socket, onSecure) {
	return startTls({
		socket: socket,
		pair: tls.createSecurePair(crypto.createCredentials(), false)
	}, onSecure);
};

function startTls(options, onSecure) {
	var socket, host, securePair, clearText;

	socket = options.socket;
	host = options.host;
	securePair = options.pair;

	socket.ondata = null;
	socket.removeAllListeners('data');

	clearText = pipe(securePair, socket);

	securePair.once('secure', function() {
		var err;

		// A cleartext stream has the boolean property 'authorized' to determine if it was verified by the CA. If 'authorized' is false, a property 'authorizationError' is set on the stream.
		err = securePair.ssl.verifyError();
		if (err) {
			clearText.authorized = false;
			clearText.authorizationError = err;
		} else {
			clearText.authorized = true;
		}

		// The callback parameter is optional.
		if (!onSecure) {
			return;
		}

		if (host && !tls.checkServerIdentity(host, clearText.getPeerCertificate())) {
			err = new Error('Server identity mismatch: invalid certificate for ' + host + '.');
		}

		onSecure.call(securePair, err);
	});

	clearText._controlReleased = true;

	return securePair;
}

function forwardEvents(events, emitterSource, emitterDestination) {
	var i, l, event, handler, forwardEvent;

	forwardEvent = function() {
		this.emit.apply(this, arguments);
	};

	for (i = 0, l = events.length; i < l; i++) {
		event = events[i];
		handler = forwardEvent.bind(emitterDestination, event);

		emitterSource.on(event, handler);
	}
}

function removeEvents(events, emitterSource) {
	var i, l;

	for (i = 0, l = events.length; i < l; i++){
		emitterSource.removeAllListeners(events[i]);
	}
}

function pipe(securePair, socket) {
	var clearText, onError, onClose, events;

	events = ['timeout', 'end', 'drain'];
	clearText = securePair.cleartext;

	onError = function(err) {
		if (clearText._controlReleased) {
			clearText.emit('error', err);
		}
	};

	onClose = function() {
		socket.removeListener('error', onError);
		socket.removeListener('close', onClose);
		removeEvents(events, socket);
	};

	// Forward event emissions from the socket to the cleartext stream.
	forwardEvents(events, socket, clearText);
	socket.on('error', onError);
	socket.on('close', onClose);

	securePair.on('error', function(err) {
		onError(err);
	});

	securePair.encrypted.pipe(socket);
	socket.pipe(securePair.encrypted);

	securePair.fd = socket.fd;

	clearText.socket = socket;
	clearText.encrypted = securePair.encrypted;
	clearText.authorized = false;

	return clearText;
}
