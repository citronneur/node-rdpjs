/**
 * test file
 */
var rdp = require("../lib");

function Factory() {
	
}

Factory.prototype = {
	buildProtocol : function(socket) {
		return new rdp.net.layer.BufferLayer(socket, rdp.rdp.TPKT(new rdp.rdp.X224.Client()));
	}
};

new rdp.net.Reactor(new Factory()).connect('wav-glw-009', 3389);