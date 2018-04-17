const keystone = require('keystone');
const jwt = require("jsonwebtoken");
const moment = require("moment");
const _=require("lodash");
const bcrypt = require("bcryptjs");
const Types = keystone.Field.Types;
const mongoose = keystone.mongoose;

/**
 * User Model
 * ==========
 */

var User = new keystone.List('User',{
	autokey:{path:'slug', from:'username',uniqe:true}
});

// var myStorage = new keystone.Storage({
// 	adapter: keystone.Storage.Adapters.FS,
// 	schema:{
// 		size: true,
// 		mimetype: true,
// 		path: true,
// 		originalname: false,
// 		url: true,
// 	  },
// 	fs: {
// 	  path: keystone.expandPath('./public/uploads/images'), // required; path where the files should be stored
// 	  publicPath: '/public/uploads/images', // path where files will be served
// 	}
//   });


User.add({
	// userImage:{
	// 	type: Types.File,
	// 	storage:myStorage
	// },
	userImage:{type:String},
	username: { type: String, required: true, initial:true,uniqe:true, index: true },
	name:{type:Types.Name,required:true,index:true},
	email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
	password: { type: Types.Password, initial: true, required: true },
	loggedOutAt:{type:Types.Datetime, hidden: true,default:null},
	isOnline:{type:Types.Boolean, hidden: true ,default:true},
	resetPasswordKey: { type: String, hidden: true },
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true },
});

// // add tokens field to the database . asly
var tokens = new mongoose.Schema([{
	token: { type: String},
	access: { type: String}
}]);

console.log('tokens ---+++>>>>#',typeof(tokens));

User.schema.add({
	tokens :tokens
});


// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});

//ignore certain fields from mongoose schema when return object to client . [when user.toJSON() called]
User.schema.methods.toJSON=function(){
    var user = this;
    var userObject = user.toObject();
    return _.pick(userObject,['_id','email','username','isAdmin','name','tokens','resetPasswordKey','isOnline','loggedOutAt','userImage']);
}



//Generate user token for authentication and authorization .
User.schema.methods.generateAuthToken = function () {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access},'abc123').toString();
	user.tokens=[{access, token}];
	console.log('type from generate token +>:',typeof(user.tokens));
	return user.save().then(() => {
		return token;
	});
};


// User.schema.statics.findByToken = function(token){
// 	console.log('from user',token);
// 	var User = this;
// 	var decoded;
// 	try{
// 	  decoded = jwt.verify(token,'abc123');
// 	  console.log('token id',decoded._id);
// 	}catch(err){
// 		console.log('find by token error');
// 	   	return Promise.reject();
// 	}
// 	return User.findOne({
// 		'_id':decoded._id,
// 		'tokens.token':token,
// 		'tokens.access':'auth'
// 	});
// }

//UserModel.findOne({_id: id}, function (err, user) { ... });

User.schema.statics.findByToken = function(token){
	console.log('from user',token);
	var User = this;
	var decoded;
	try{
	  decoded = jwt.verify(token,'abc123');
	  console.log('token id',decoded._id);
	}catch(err){
		console.log('find by token error');
	   	return Promise.reject();
	}
	return User.findOne(
		{
			_id:decoded._id,
			'tokens.0.token':token,
			'tokens.0.access':'auth'

		}
		,function(err,user){
		if(!user){
			console.log('not found by id');
		}else{
			console.log('user found :---->',user);
		}
	});
}

// // logout the user by removing his token.
// User.schema.methods.removeToken = function(token){
//   var user = this;
//   console.log('remove user :',user);
//   console.log('user.tokens:',user.tokens,typeof(user.tokens));
//   return user.update({
// 	  $pull:{
// 		  tokens:{'0.token':token}
// 	  }
//   });
// }

//db.test.update({"city":"Palo Alto"},{"$pull":{"friends":{"name":"Frank"}}});
// logout the user by removing his token.
User.schema.methods.removeToken = function(token){
	var user = this;
	console.log('remove user :',user);
	console.log('user.tokens:',user.tokens,typeof(user.tokens));
	// return user.update({$unset:{tokens:""}});
	return user.update({$set: {'tokens.0.token': "",'isOnline':false,'loggedOutAt':moment().format()}})
  }
//db.books.update( { _id: 1 }, { $unset: { tags: "" } } )

// find user by credentials [e-mail , password].
User.schema.statics.findByCredentials= function(email,password){
	console.log(email,password);
  var User = this;
  return User.findOne({email}).then((user)=>{
		 if(!user){
			 console.log('user not found');
			   return Promise.reject();
		   }
		 return new Promise((resolve,reject)=>{
			 bcrypt.compare(password,user.password,(err,res)=>{
				 console.log('hash',user.password);
				 if(res){
					console.log('resolve',res);
					 resolve(user);
				 }else{
					console.log('reject',err);
					 reject();
				 }
			 });
		 });
  });
}

// before saving the password to the database we want to hashing it . [keystone Types.Password handle this task]

// User.schema.pre('save',function(next){
// 	var user = this;
// 	if(user.isModified('password')){
// 		bcrypt.genSalt(10,(err,salt)=>{
// 		  bcrypt.hash(user.password,salt,(err,hash)=>{
// 			 user.password = hash;
// 			 console.log(hash);
// 			 next();
// 		  });
// 		});
// 	}else{
// 		next();
// 	}
// });





/**
 * Registration
 */
User.defaultColumns = 'name, email, isAdmin';
User.register();
