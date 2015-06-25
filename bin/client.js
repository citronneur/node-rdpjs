/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : 'siradel', userName : 'speyrefitte'}).connect('srv-lic-001', 3389);