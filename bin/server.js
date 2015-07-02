/**
 * test file
 */
var rdp = require("../lib");


rdp.createServer({
	key : '/home/sylvain/dev/node-rdp-cert/ryans-key.pem',
	cert : '/home/sylvain/dev/node-rdp-cert/ryans-cert.pem'
}, function (server) {
	
}).listen(33390);