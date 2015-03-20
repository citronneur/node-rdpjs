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
var log = require('./log');

/**
 * Handle tcp net events
 * @returns new Reactor
 */
function Reactor() {
}

/**
 * Start connection and build protocol 
 * @param {string}	host	destination host
 * @param {int}		port	destination port
 * @param {Factory}	factory	protocol factory
 */
Reactor.prototype.connect = function(host, port, factory) {
	var s = new net.Socket();	
	s.connect(port, host, function() {
		
		var protocol = factory.buildProtocol(s);
		protocol.connect();
		
		s.on('data', function(data) {
			protocol.recv(data);
		});
		
		s.on('close', function() {
			
		});
	});
};

/**
 * Start connection and build protocol 
 * @param {int} 		port	destination port
 * @param {Factory} 	factory	protocol factory
 */
Reactor.prototype.listen = function(port, factory) {
	var server = net.createServer(function(s) {
		log.info("new connection on server");
		
		var protocol = factory.buildProtocol(s);
		s.on('data', function(data) {
			protocol.recv(data);
		});
		
		s.on('close', function() {
			
		});
		
		s.on('end', function() {
			
		});
		
		protocol.connect();
	});
	
	server.on('error', function (e) {
		if (e.code == 'EADDRINUSE') {
			log.error('address in use');
			this.close();
		}
	});
	
	server.listen(port, function() {
		log.info("server listen on "+port);
	});
};

/**
 * Module exports
 */
module.exports = Reactor;