const keystone = require('keystone');
const jwt = require("jsonwebtoken");
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


User.add({
	username: { type: String, required: true, initial:true,uniqe:true, index: true },
	name:{type:Types.Name,required:true,index:true},
	email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
	password: { type: Types.Password, initial: true, required: true },
	resetPasswordKey: { type: String, hidden: true },
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true },
});

// add tokens field to the database .
var tokens = new mongoose.Schema([{
	token: { type: String},
	access: { type: String}
}]);

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
    return _.pick(userObject,['_id','email','username','name']);
}



//Generate user token for authentication and authorization .
User.schema.methods.generateAuthToken = function () {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access},'abc123').toString();
	user.tokens=[{access, token}];
	return user.save().then(() => {
		return token;
	});
};


User.schema.statics.findByToken = function(token){
	var User = this;
	var decoded;
	try{
	  decoded = jwt.verify(token,'abc123');
	}catch(err){
	   return Promise.reject();
	}
	return User.findOne({
		'_id':decoded._id,
		'tokens.token':token,
		'tokens.access':'auth'
	})
}

// logout the user by removing his token.
User.schema.methods.removeToken = function(token){
  var user = this;
  return user.update({
	  $pull:{
		  tokens:{token}
	  }
  });
   
}
   
// find user by credentials [e-mail , password].
User.schema.statics.findByCredentials= function(email,password){
  var User = this;
  return User.findOne({email}).then((user)=>{
		 if(!user){
			   return Promise.reject();
		   }
		 return new Promise((resolve,reject)=>{
			 bcrypt.compare(password,user.password,(err,res)=>{
				 if(res){
					 resolve(user);
				 }else{
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
