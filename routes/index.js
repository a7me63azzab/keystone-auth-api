
/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var cors = require('cors');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function (app) {
	// Views
	app.get('/', routes.views.index);

	//to solve this error“No 'Access-Control-Allow-Origin' header is present on the requested resource” 
	//error when Postman does not?
	// to make keystone pass Cross-Origin Resource Sharing (CORS) related errors
	app.use(function(req, res, next) { //allow cross origin requests
		res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
		res.header("Access-Control-Allow-Origin", "http://localhost:8080");
		res.header("Access-Control-Allow-Headers","Content-Type");
		res.header("Access-Control-Expose-Headers", "Access-Control-Allow-Headers,X-auth,Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	// to solve OPTIONS 404s error
	app.options('/api*', function(req, res) { res.sendStatus(200); });


	//----------------------------------------------//
	
	//userRegister
	app.post('/api/auth/register',cors(),routes.api.auth.registerUser);
	//userLogIn
	app.post('/api/auth/login',cors(),routes.api.auth.userLogin);
	//get All Users
	app.get('/api/auth/all',cors(),routes.api.auth.getAllUsers);

	//forget Password
	app.post('/api/auth/forgetpassword',cors(),routes.api.auth.forgetPassword);
	
	//reset Password
	app.post('/api/auth/resetpassword/:resetpasswordkey',cors(),routes.api.auth.resetPassword);
	

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
