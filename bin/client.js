/**
 * test file
 */
var rdp = require("../lib");

function Factory() {
	
}

Factory.prototype = {
	buildProtocol : function(socket) {
		return new rdp.core.layer.BufferLayer(socket, new rdp.protocol.TPKT(new rdp.protocol.x224.Client(new rdp.protocol.t125.mcs.Client())));
	}
};
new rdp.core.Reactor().connect('wav-glw-009', 3389, new Factory());