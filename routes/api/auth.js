var keystone = require('keystone'),
    User = keystone.list('User');
var _ = require('lodash');
let randomstring = require('randomstring');
let crypto = require('crypto-js');
let fs = require('fs');
const md5 = require('md5');
const {ObjectID} = require("mongodb");
var {sendEmail} = require('../../lib/send-email');

let _generateUniqueFileName = () => crypto.SHA256(randomstring.generate() + new Date().getTime() + 'hasve').toString();

const getUserGavatar=(email)=>{
      let emailHash = md5( email.toLowerCase().trim() );
      console.log('emailHash',emailHash);
      return `https://www.gravatar.com/avatar/${emailHash}?d=monsterid`
    }


// exports.registerUser = (req, res)=>{

//   let imgRawData = req.body.imgData.replace(/^data:image\/\w+;base64,/, "");

//   let buf = new Buffer(imgRawData, 'base64'); //[?]
//   let fileName = _generateUniqueFileName() + '.png';
//   let filePath = 'public/uploads/files/';
//   fs.writeFile(filePath + fileName, buf, (err) => {
//     if (err) {
//       console.log('file not saved',err);
//     }

//     var userData = {
//       userImage: {
//         filename: fileName,
//         size: buf.toString().length,
//         mimetype: 'image/jpeg',
//         path: filePath,
//         //originalname: 'photo.jpg',
//         url: "http://localhost:3000/uploads/files/" + fileName,
//       },
//       name:{
//         first:req.body.first,
//         last:req.body.last
//       },
//       username:req.body.username,
//       email:req.body.email,
//       password:req.body.password,
//       isOnline:req.body.isOnline
//     };
//     console.log('userData',userData);
//     var newUser = new User.model(userData);
//     newUser.save().then(() => {
//         return newUser.generateAuthToken();
//       }).then((token) => {
//         res.header('X-auth', token).send(newUser.toJSON());
//       }).catch((e) => {
//         console.log('error');
//         res.status(400).send(e);
//       })
//       });
// };


exports.registerUser = (req, res)=>{

  // 1- check if the user is already registered or not
  // get user by email
  User.model.findOne({
    email:req.body.email
    }).then((user)=>{
        console.log("user",user);
        if(!user){
          console.log('image data -->',req.body.imgData);
          if(req.body.imgData){
            console.log('image data --> blender');
            //add new user
            let imgRawData = req.body.imgData.replace(/^data:image\/\w+;base64,/, "");

              let buf = new Buffer(imgRawData, 'base64'); //[?]
              let fileName = _generateUniqueFileName() + '.png';
              let filePath = 'public/uploads/files/';
              fs.writeFile(filePath + fileName, buf, (err) => {
                if (err) {
                  console.log('file not saved',err);
                }

                let userData = {
                  // userImage: {
                  //   filename: fileName,
                  //   size: buf.toString().length,
                  //   mimetype: 'image/jpeg',
                  //   path: filePath,
                  //   //originalname: 'photo.jpg',
                  //   url: "http://localhost:3000/uploads/files/" + fileName,
                  // },
                  userImage:"http://localhost:3000/uploads/files/" + fileName,
                  name:{
                    first:req.body.first,
                    last:req.body.last
                  },
                  username:req.body.username,
                  email:req.body.email,
                  password:req.body.password,
                  isOnline:req.body.isOnline
                };
                console.log('userData',userData);
                var newUser = new User.model(userData);
                newUser.save().then(() => {
                    return newUser.generateAuthToken();
                  }).then((token) => {
                    res.header('X-auth', token).send(newUser.toJSON());
                  }).catch((e) => {
                    console.log('error');
                    res.status(400).send(e);
                  })
                  });
          }else{
              console.log('image data --> raven');
            let userData = {
              userImage:getUserGavatar(req.body.email),
              name:{
                first:req.body.first,
                last:req.body.last
              },
              username:req.body.username,
              email:req.body.email,
              password:req.body.password,
              isOnline:req.body.isOnline
            };
            console.log('userData',userData);
            var newUser = new User.model(userData);
            newUser.save().then(() => {
                return newUser.generateAuthToken();
              }).then((token) => {
                res.header('X-auth', token).send(newUser.toJSON());
              }).catch((e) => {
                console.log('error');
                res.status(400).send(e);
              })
          }
        }else{
          res.send({isRegistered:true});
          console.log('user alreday registered');
        }
    }).catch((err)=>{
      console.log('erroooooor');
      res.status(400).send();
    });
};



// exports.registerUser = (req, res)=>{
//   var userData = req.body;
//   // 1- check if the user is already registered or not
//   // get user by email
//     var email = userData.email;
//   User.model.findOne({
//     email:email
//     }).then((user)=>{
//         console.log("user",user);
//         if(!user){
//           //add new user
//             var newUser = new User.model(userData);
//             newUser.save().then(() => {
//                 return newUser.generateAuthToken();
//               }).then((token) => {
//                 res.header('X-auth', token).send(newUser.toJSON());
//                 res.send({isRegistered:false});
//               }).catch((e) => {
//                 console.log('error');
//                 res.status(400).send(e);
//               })
//         }else{
//           res.send({isRegistered:true});
//           console.log('user alreday registered');
//         }
//     }).catch((err)=>{
//       console.log('erroooooor');
//       res.status(400).send();
//     });
// };

exports.getAllUsers = (req,res) =>{
  User.model.find().then((users)=>{
    console.log(JSON.stringify(users,undefined,2));
    res.send({users});
},(err)=>{
    console.log(err);
    res.status(400).send(err);
});
};

exports.getUserById = (req,res)=>{
    var id = req.params.id;
    console.log('id',id);
    if(!ObjectID.isValid(id)){
      console.log('invalid id');
        return res.status(404).send();
    }
    User.model.findOne({
        _id:id
    }).then((user)=>{
        console.log("user",user);
        if(!user){
          console.log('user not found');
            return res.status(404).send();
        }
        res.send({user});
    }).catch((err)=>{
      console.log('erroooooor');
      res.status(400).send();
    });
}

exports.userLogin = (req, res)=>{
  var body = _.pick(req.body,['email','password']);
  console.log(body.password);
  User.model.findByCredentials(body.email,body.password).then((user)=>{
      return user.generateAuthToken().then((token)=>{
        user['x-auth']={token};
        res.header('x-auth',token).send(user.toJSON()); //if i want to send the token into the header.
        // res.send(token);
      });
  }).catch((err)=>{
    console.log('aya');
      res.status(400).send({
        success:false
      });
  });
};

//User logout
exports.userLogout=(req,res)=>{
    req.user.removeToken(req.token).then(()=>{
      res.status(200).send();
    }).catch((err)=>{
      console.log('error ++++> ###',err);
      res.status(400).send();
    });
}

// Reset Password
exports.forgetPassword = (req, res)=>{
  //var body =_.pick(res.body,['email']);
  var email = req.body.email;
  if(!email) return res.send({Error: "Please enter an emailaddress."});
  User.model.findOne({email}).then((user)=>{
        if(!user){
          res.status(404).send({error:'user not found'});
        }
        user.resetPasswordKey = keystone.utils.randomString([16,24]);
        user.save().then(()=>{
          sendEmail(user);
          res.send({user});
        }).catch((err)=>{
          res.status(400).send();
        });
  })


};

exports.resetPassword = (req, res)=>{
  var newPassword = req.body.newPassword;
  var confirmNewPassword = req.body.confirmNewPassword;
  var resetPasswordKey = req.params.resetpasswordkey;
  if(!newPassword || !confirmNewPassword) return res.send({Error: "Please enter new password."});
  // if (!req.body.password || !req.body.password_confirm) {
  //   req.flash('error', "Please enter, and confirmyour new password.");
  //   return res.redirect('/resetpassword/'+req.params.key);
  //   }
  if (newPassword != confirmNewPassword) {
    return  res.send({Error: 'Please make sure both passwords match.'});
    // return res.redirect('/resetpassword/'+req.params. key);
  }

  User.model.findOne({resetPasswordKey}).then((user)=>{
    if(!user) return res.send({Error:'User Not Found'});
    res.send({user});
    user.password = newPassword;
    user.resetPasswordKey='';
    user.save().then(()=>{
      res.send({success:'📬 Password reset Successfully'});
    }).catch((err)=>{
      res.send({Error:'📬 Password reset Falied'});
    })

  }).catch((err)=>{
    res.send({Error:'User Not Found'});
  });
};

//Confirm user password

exports.passwordConfirm = (req, res)=>{
  var email = req.body.email;
  var password = req.body.password;
  if(!email && !password) return res.send({Error: "email and password are required"});
  User.model.findByCredentials(email,password).then((user)=>{
      res.status(200).send(user.toJSON());
    }).catch((err)=>{
        res.status(400).send({
          error:'password is incorrect'
        });
    });
}

//Update User Profile
exports.updateProfile=(req,res)=>{

  let userEmail = req.body.email;
  let imageData = req.body.imgData;
  let userName = req.body.username;
  let imageUrl = req.body.userImage;


  if(imageData){

    if(imageUrl && imageUrl.includes('public/uploads/files/')){
      var imageName = imageUrl.split('/').pop();
      fs.unlink(`public/uploads/files/${imageName}`, function(err) {
        if(err && err.code == 'ENOENT') {
            // file doens't exist
            console.info("File doesn't exist, won't remove it.");
        } else if (err) {
            // other errors, e.g. maybe we don't have enough permission
            console.error("Error occurred while trying to remove file");
        } else {
            console.info(`removed`);
        }
    });
    }
  //-----------------
  let imgRawData = imageData.replace(/^data:image\/\w+;base64,/, "");

  let buf = new Buffer(imgRawData, 'base64'); //[?]
  let fileName = _generateUniqueFileName() + '.png';
  let filePath = 'public/uploads/files/';
  fs.writeFile(filePath + fileName, buf, (err) => {
    if (err) {
      console.log('file not saved',err);
    }

    User.model.findOne({ email: userEmail}).then(user=>{
      if(!user) return res.send({Error:'User Not Found'});
      user.username = userName;
      user.userImage="http://localhost:3000/uploads/files/" + fileName;
      user.save().then(()=>{
        res.status(200).send(user.toJSON());
      }).catch(err=>{
        res.status(400).send({error:' UserProfile not updated'});
      });

    }).catch(err=>{
      console.log('user not found',err);
    });
      });
  }else{
    User.model.findOne({ email: userEmail}).then(user=>{
      if(!user) return res.send({Error:'User Not Found'});
      user.username = userName;
      user.userImage=imageUrl;
      user.save().then(()=>{
        res.status(200).send(user.toJSON());
      }).catch(err=>{
        res.status(400).send({error:' UserProfile not updated'});
      });

    }).catch(err=>{
      console.log('user not found',err);
    });
  }
}

//update User Password
exports.updatePassword=(req,res)=>{
  let email=req.body.email;
  let newPassword=req.body.password;
  if(email && newPassword){
    User.model.findOne({email:email}).then(user=>{
      if(!user) return res.status(400).send({error:'user Not Found'});
      user.password=newPassword;
      user.save().then(()=>{
        res.status(200).send({success:true});
      }).catch(err=>{
        res.status(400).send({success:false});
      });
    }).catch(er=>{
      res.status(400).send({error:'user not found'});
    });
  }
}
