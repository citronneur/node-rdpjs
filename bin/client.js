/**
 * test file
 */
var rdp = require("../lib");

function Factory() {
	
}

Factory.prototype = {
	buildProtocol : function(socket) {
		return new rdp.core.layer.BufferLayer(socket, new rdp.protocol.TPKT(new rdp.protocol.X224.Client()));
	}
};
new rdp.core.Reactor().connect('54.187.36.238', 3389, new Factory());