# Start TLS #

[![Build Status](https://travis-ci.org/mattcg/starttls.png?branch=master)](https://travis-ci.org/mattcg/starttls)

Upgrade a regular [`net.Stream`](http://nodejs.org/api/net.html#net_class_net_socket) connection to a secure [`tls`](http://nodejs.org/api/tls.html) connection.

Based on code by [Andris Reinman](https://github.com/andris9/rai/blob/master/lib/starttls.js), itself based on an older version by [Nathan Rajlich](https://gist.github.com/TooTallNate/848444).

## Usage ##

This library has one method and accepts either an options hash or a prepared socket as the first argument. It returns a [`SecurePair`](http://nodejs.org/api/tls.html#tls_class_securepair).

### starttls(options, [onSecure]), starttls(socket, [onSecure]) ###

The following options are supported:

- `socket` - if not provided, a socket will be created using [`net.createConnection`](http://nodejs.org/api/net.html#net_net_createconnection_options_connectionlistener)
- `host` - used to perform automatic certificate identity checking, to guard against MITM attacks
- `port` - only used to create a socket (along with the `host` option) if `socket` is not provided
- `pair` - if you want to provide your own [`SecurePair`](http://nodejs.org/api/tls.html#tls_class_securepair) object

The `onSecure` callback is  optional and receives `null` or an error object as the first argument (see below for error cases). Within the callback context, `this` refers to the same [`SecurePair`](http://nodejs.org/api/tls.html#tls_class_securepair) object returned by `starttls`.

```javascript
var net = require('net');
var starttls = require('starttls');
var options = {
	port: 21,
	host: example.com
};

net.createConnection(options, function() {
	options.socket = this;
	starttls(options, function(err) {
		if (err) {

			// Something bad happened!
			return;
		}

		this.cleartext.write('garbage');
	});
});
```

You should always check for an error before writing to the stream to avoid man-in-the-middle attacks. Errors are produced in the following cases:

- the certificate authority authorization check failed or was negative
- the server identity check was negative

If you only pass a socket object, server identity checking will not be performed automatically. In that case you should perform the check manually.

```javascript
starttls(socket, function(err) {
	if (!tls.checkServerIdentity(host, this.cleartext.getPeerCertificate())) {

		// Hostname mismatch!
		// Report error and end connection...
	}
});
```

## Example ##

See [socks5-https-client](https://github.com/mattcg/socks5-https-client) for use-case.

## Tests ##

Run `make test` or `npm test` to run tests.

## License ##

Portions of this code copyright (c) 2012, Andris Reinman and copyright (c) 2011, Nathan Rajlich.

Modified and redistributed under an [MIT license](http://mattcg.mit-license.org/).
