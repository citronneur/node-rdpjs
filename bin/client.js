/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : 'siradel', userName : 'speyrefitte'}).connect('54.187.36.238', 3389);