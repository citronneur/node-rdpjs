/**
 * test file
 */
var rdp = require("../lib");

function Factory() {
	
}

Factory.prototype = {
	buildProtocol : function(socket) {
		return new rdp.core.layer.BufferLayer(socket, new rdp.rdp.TPKT(new rdp.rdp.X224.Client()));
	}
};

new rdp.core.Reactor(new Factory()).connect('54.187.36.238', 3389);