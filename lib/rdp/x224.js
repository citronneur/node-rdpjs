var inherit = require('util').inherit;

function X224(presentation) {
	this.presentation = presentation;
}

function Client() {
	X224.call(this);
}

Client.prototype.connect = function() {
	
};



/**
 * Module exports
 */
module.exports = {
	Client : Client
};