/**
 * test file
 */
var rdp = require("../lib");


rdp.createClient({ domain : 'siradel', userName : 'speyrefitte', password : 'toto'}).connect('wav-glw-009', 3389);