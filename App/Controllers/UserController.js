var Sys = require('../../Boot/Sys');
var bcrypt = require('bcryptjs');

module.exports = {
  users: async function(req,res){
    try {
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        userActive : 'active'
      };
      return res.render('user/user',data);
    } catch (e) {
      console.log("Error",e);
    }
  },

  getUser: async function(req,res){
    try {
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let search = req.query.search.value;

      let query = {};
      if (search != '') {
        query = { email: { $regex: '.*' + search + '.*' } };
      } else {
        query = { };
      }
      let playersCount = await Sys.App.Services.UserServices.getUserCount(query);
      let data = await Sys.App.Services.UserServices.getUserDatatable(query, length, start);

      var obj = {
        'draw': req.query.draw,
        'recordsTotal': playersCount,
        'recordsFiltered': playersCount,
        'data': data
      };
      res.send(obj);
    } catch (e) {
        console.log("Error",e);
    }
  },

  addUser: async function(req,res){
    try {
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        userActive : 'active'
      };
      return res.render('user/add',data);
    } catch (e) {
        console.log("Error",e);
    }
  },

  addUserPostData: async function(req,res){
    try {
      let player = await Sys.App.Services.UserServices.getUserData({email: req.body.email});
      if (player && player.length >0) {
        req.flash('error', 'User Already Present');
        res.redirect('/');
        return;
      }else {
        await Sys.App.Services.UserServices.insertUserData({
            name: req.body.username,
            email: req.body.email,
            role: req.body.role,
            status: req.body.status,
            password : bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null)
        })
        req.flash('success','User create successfully');
        res.redirect('/user');
      }
    } catch (e) {
        console.log("Error",e);
    }
  },

  getUserDelete: async function(req,res){
    try {
      let player = await Sys.App.Services.UserServices.getUserData({_id: req.body.id});
      if (player || player.length >0) {
        await Sys.App.Services.UserServices.deleteUser(req.body.id)
        return res.send("success");
      }else {
        return res.send("error");
      }
    } catch (e) {
        console.log("Error",e);
    }
  },

  editUser: async function(req,res){
    try {
      let user = await Sys.App.Services.UserServices.getSingleUserData({_id: req.params.id});
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        user: user,
        userActive : 'active'
      };
      return res.render('user/add',data);
    } catch (e) {
      console.log("Error",e);
    }
  },

  editUserPostData: async function(req,res){
    try {
      let player = await Sys.App.Services.UserServices.getUserData({_id: req.params.id});
      if (player && player.length >0) {

        if (req.files) {
          let image = req.files.image;
          image.mv('/profile/'+req.files.image.name, function(err) {
            if (err){
              req.flash('error', 'User Already Present');
              return res.redirect('/');
            }
          });
        }
        await Sys.App.Services.UserServices.updateUserData({
            _id: req.params.id
        },{
            name: req.body.username,
            role: req.body.role,
            status: req.body.status
        });
        req.flash('success','User update successfully');
        res.redirect('/user');
      }else {
        req.flash('error', 'No User found');
        res.redirect('/user');
        return;
      }
    } catch (e) {
        console.log("Error",e);
    }
  },
}
