/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : '', userName : '', decompress : false, logLevel : 'INFO'}).connect('', 3389);