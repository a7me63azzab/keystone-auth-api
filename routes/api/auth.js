var keystone = require('keystone'),
    User = keystone.list('User');
var _ = require('lodash');
var {sendEmail} = require('../../lib/send-email');


exports.registerUser = (req, res)=>{
    var userData = req.body;
    var newUser = new User.model(userData);
    newUser.save().then(() => {
        return newUser.generateAuthToken();
      }).then((token) => {
        res.header('X-auth', token).send(newUser.toJSON());
      }).catch((e) => {
        res.status(400).send(e);
      })
};

exports.getAllUsers = (req,res) =>{
  User.model.find().then((users)=>{
    console.log(JSON.stringify(users,undefined,2));
    res.send({users});
},(err)=>{
    console.log(err);
    res.status(400).send(err);
});
};

exports.userLogin = (req, res)=>{
  var body = _.pick(req.body,['email','password']);
  User.model.findByCredentials(body.email,body.password).then((user)=>{
      return user.generateAuthToken().then((token)=>{
        user['x-auth']={token};
        res.header('x-auth',token).send(user.toJSON()); //if i want to send the token into the header.
        // res.send(token);
      });
  }).catch((err)=>{
      res.status(400).send({
        success:false
      });
  });
};

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
