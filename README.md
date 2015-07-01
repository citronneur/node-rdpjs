node-rdp
========

Remote Desktop Protocol for Node.js

node-rdp is a pure implementation of the Microsoft RDP (Remote Desktop Protocol) protocol (client and server side). node-rdp support only SSL security layer.

## Simple RDP Client

To create a simple rdp client : 

```javascript
var rdp = require('rdp');

rdp.createClient({ 
	domain : 'my_domain', 
	userName : 'my_username',
	password : 'my_password',
	enablePerf : true,
	autoLogin : true,
	screen : { width : 800, height : 600 }
}).on('connect', function () {
}).on('bitmap', function(bitmap) {
}).on('close', function() {
}).on('error', function(err) {
}).connect(infos.ip, infos.port);
```

Most of bitmap are encoded with RLE (Run Length Encoding) algorithm. It's not the purpose of node-rdp to embed decompression algorithm. See mstsc.js to see a pure javascript implementation (for browser).
