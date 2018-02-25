
// import { authenticate } from './middleware';

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
		res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET,PATCH");
		res.header("Access-Control-Allow-Origin", "http://localhost:3001");
		// res.header("Access-Control-Allow-Headers","Content-Type");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Authorization,X-auth,Content-Type, Accept, Authorization");
		res.header("Access-Control-Expose-Headers", "Access-Control-Allow-Headers,X-auth,Origin, X-Requested-With,Authorization,Content-Type, Accept");
		next();
	});
	// to solve OPTIONS 404s error
	app.options('/api*', function(req, res) { res.sendStatus(200); });



	
	//userRegister
	app.post('/api/auth/register',cors(),routes.api.auth.registerUser);
	//userLogIn
	app.post('/api/auth/login',cors(),routes.api.auth.userLogin);
	//get All Users
	app.get('/api/auth/all',cors(),middleware.authenticate,routes.api.auth.getAllUsers);

	//get user by id
	app.get('/api/auth/user/:id',middleware.authenticate,routes.api.auth.getUserById);

	//forget Password
	app.post('/api/auth/forgetpassword',cors(),routes.api.auth.forgetPassword);
	
	//reset Password
	app.post('/api/auth/resetpassword/:resetpasswordkey',cors(),routes.api.auth.resetPassword);

	

	//logout
	app.delete('/api/auth/logout',middleware.authenticate,cors(),routes.api.auth.userLogout);


	//Confirm password
	app.post('/api/auth/passwdconfirm',cors(),routes.api.auth.passwordConfirm);

	//update User Profile
	app.patch('/api/auth/updateprofile',cors(),routes.api.auth.updateProfile);

	//update user password
	app.patch('/api/auth/updatepassword',cors(),routes.api.auth.updatePassword);



	// COPY THE CODE FROM HERE...
	//File Upload Route
	// the fileupload routes..
	app.get('/api/fileupload/list', keystone.middleware.api, routes.api.fileupload.list);
	app.get('/api/fileupload/:id', keystone.middleware.api, routes.api.fileupload.get);
	app.all('/api/fileupload/:id/update', keystone.middleware.api, routes.api.fileupload.update);
	app.all('/api/fileupload/create', keystone.middleware.api, routes.api.fileupload.create);
	app.get('/api/fileupload/:id/remove', keystone.middleware.api, routes.api.fileupload.remove);

	// ...TO HERE.
	

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
