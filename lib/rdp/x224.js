var inherit = require('util').inherit;
var binary = require('../net').binary;



/**
 * Common X224 Automata
 * @param {Layer} presentation
 */
function X224(presentation) {
	this.presentation = presentation;
}

/**
 * Client x224 automata
 */
function Client() {
	X224.call(this);
}

/**
 * Client automata connect event
 */
Client.prototype.connect = function() {
	
};

/**
 * Module exports
 */
module.exports = {
	Client : Client
};