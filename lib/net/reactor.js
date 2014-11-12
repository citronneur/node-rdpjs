var net = require('net');

/**
 * Handle tcp net events
 * @param factory
 * @returns new Reactor
 */
function Reactor(factory) {
	this.factory = factory;
}

/**
 * Start connection and build protocol 
 * @param {string} destination host
 * @param {int} destination port
 */
Reactor.prototype.connect = function(host, port) {
	var client = new net.Socket();
	var protocol = this.factory.buildProtocol(client);
	
	client.connect(port, host, function() {
		protocol.connect();
	});
	
	client.on('data', function(data) {
		protocol.recv(data);
	});
	
	client.on('close', function() {
		
	});
};

/**
 * Module exports
 */
module.exports = Reactor;