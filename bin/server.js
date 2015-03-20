/**
 * test file
 */
var rdp = require("../lib");

function Factory() {
}

Factory.prototype = {
	buildProtocol : function(socket) {
		return new rdp.core.layer.BufferLayer(socket, new rdp.protocol.TPKT(new rdp.protocol.X224.Server()));
	}
};
new rdp.core.Reactor().listen(33389, new Factory());