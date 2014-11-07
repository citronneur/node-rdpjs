/**
 * pack net packet
 */
function pack() {

}

pack.prototype = {
	/**
	 * call from tcp layer
	 * @param data tcp stream
	 */
	recv : function(data) {
		
	},
	
	/**
	 * wait expected size data before call callback function
	 * @param {number} expectSize	size expected
	 * @param {function} callback	call when enough data was receive	
	 */
	expect : function(expectedSize, callback) {
		
	}
}
