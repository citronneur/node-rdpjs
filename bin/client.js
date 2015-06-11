/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : 'siradel', userName : 'speyrefitte', password : 'toto'}).connect('totem3', 3389);