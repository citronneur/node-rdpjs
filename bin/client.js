/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : 'siradel', userName : '', decompress : false, logLevel : 'INFO'}).connect('172.16.1.62', 3389);
