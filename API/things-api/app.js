/*
Copyright (c) 2016 CATTHINGS: Nicholas McHale, Andrew McCann, Susmita Awasthi,
Manpreet Bahl, Austen Ruzicka, Luke Kazmierowicz, Hillman Chen

See LICENSE.txt for full information.
*/

//Import Packages
var express = require('express'); //Express is the Node Server Framework
var bodyParser = require('body-parser')//for parsing the body of POST's
var cookieParser = require('cookie-parser')//for parsing cookies
var argv = require('command-line-args');// utility for easy parsing of command line options
var pg = require('pg'); // pg is a library for connecting to the postgresql Database
var fs = require('fs'); // fs give us file system access
var https = require('https'); // this will allow us to host a https server
var morgan = require('morgan');//for logging requests
var cors = require('cors');//package to handle Cross Origin Resource Sharing
var routes = require('./routes');
var helpers = require('./helper_functions')
var nodemailer = require('nodemailer');

//Import Config files
var db_info = require('./conf/db/db_info'); //This file contains all of the configuration info needed to connect to the database.
var keyFile =  fs.readFileSync('./conf/ssl/server.key'); //the key for SSL
var certFile=  fs.readFileSync('./conf/ssl/server.crt'); //ssl cert(self signed)
var email_auth = require('./conf/email_auth');
var mailopt = require('./conf/mailopt');
var tokenSecret = fs.readFileSync('./conf/jwtSecret.key', 'utf-8').replace(/\s/g, '');

//setup command line args
const optionDefinitions = [
  { name: 'port', type: Number , defaultValue: 3000},
];
const options = argv(optionDefinitions);

//Instanciate global variables.
var app = express(); // This is our Express Application.
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true}));  //support url encoded bodies
app.use(cookieParser()); // midleware to parses cookies
app.use(morgan('dev')); // enables console output for dev purpouses on requests
app.use(cors()); // allow cross origin resource sharing
var pool = new pg.Pool(db_info.config); //This is the pool that DB client connections live in.


//this sets the basis for email options
let mailOptions = {

  from: mailopt.mail.from,
  to: mailopt.mail.to,
  subject: '',
  text: '',
  html: ''

};


var smtpTransport = nodemailer.createTransport({
    service: "yahoo",
    auth: email_auth.auth

});

//any global helper functions for our templates should go here:
app.locals.helpers = helpers;
app.locals.mailOptions = mailOptions;
//app.locals.mailopt = mailopt;
app.locals.tokenSecret = tokenSecret;
app.locals.options = options;
app.locals.smtpTransport = smtpTransport;
// We need to be able to access the pool from our templates,
// store the pool in app.locals
app.locals.pool = pool;

//Attatch Routes
app.use('/', express.static('Front_End'))
app.use('/api', routes);//import our routs this will import the routes

//This will launch our server, and pass it to the express app.
https.createServer({
	key: keyFile,
	cert: certFile
}, app).listen(options.port, function() {
	console.log(`Listening on port ${options.port}`);
});

//The following is depreciated as we are launching with a HTTPS server
//uncomment the following to use http and comment out the above code
/*
app.listen(3000, function () {
  console.log('Listening on port 3000');
});
*/
