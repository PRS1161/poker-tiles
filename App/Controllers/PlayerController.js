var Sys = require('../../Boot/Sys');
var bcrypt = require('bcryptjs');

module.exports = {

  addPlayer : async  function(req , res){
    try{
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        playerActive : 'active'
      };
      return res.render('player/add',data);
    } catch(e){
    console.log("Error",e);
    }
  },

  addPlayerPostData: async function(req,res){
    try {
      console.log("req.body", req.body);
      let ownerDetails;

      // Check Username Already Available
      let player = await Sys.App.Services.PlayerServices.getSinglePlayerData({ username: req.body.username });
      if (player) { // When Player Found
        req.flash('error', 'Username already taken.');
        return res.redirect('/allplayers');
      }

      // Check Email Already Available
      player = await Sys.App.Services.PlayerServices.getSinglePlayerData({ email: req.body.email });
      if (player) { // When Player Found
        req.flash('error', 'Email already taken.');
        return res.redirect('/allplayers');
      }
       
      let role = "admin";
      ownerDetails = await Sys.App.Services.UserServices.getByData();
      console.log(ownerDetails);
      let settings = await Sys.App.Services.SettingsServices.getSettingsData({}); // tmp
      let chips = settings.defaultChips ? parseInt(settings.defaultChips) : 0; // tmp

      player = await Sys.App.Services.PlayerServices.insertPlayerData({
        username: req.body.username.toLowerCase(),
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        device_id: await randomString(36),
        chips: chips, // tmp
        profilePic: 0,
        socketId: '1234',
        fcmId: ''
      });
      console.log("player", player);

      req.flash('success','Player create successfully');
      return res.redirect('/allplayers');
    } catch (e) {
      console.log("Error",e);
      return res.redirect('/allplayers');
    }
  },

  editPlayer: async function(req,res){
    try {
      let player = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id: req.params.id});
      var data = {
          App : Sys.Config.App.details,Agent : req.session.details,
          error: req.flash("error"),
          success: req.flash("success"),
          playerActive : 'active',
          player: player
        };
        req.session.playerBack = req.header('Referer');
      return res.render('player/add',data);
      // res.send(player);
    } catch (e) {
      console.log("Error",e);
    }
  },


  editPlayerPostData: async function(req,res){
      try {
        let player = await Sys.App.Services.PlayerServices.getPlayerData({_id: req.params.id});
        if (player && player.length >0) {

          if (req.files) {
            let image = req.files.image;
            // Use the mv() method to place the file somewhere on your server 
            image.mv('/profile/'+req.files.image.name, function(err) {
              if (err){
                req.flash('error', 'User Already Present');
                return res.redirect('/');
              }

              // res.send('File uploaded!');
            });
          }

          let isUserExists = await Sys.App.Services.PlayerServices.getPlayerData({username: req.body.username.toLowerCase()});
          if (isUserExists && isUserExists.length >0 && isUserExists[0].username != player[0].username) {
            req.flash('error', 'Username Already Exist');
            res.redirect('/playerEdit/'+req.params.id);
            return;
          }

					let data = {
						username: req.body.username.toLowerCase(),
						email: req.body.email,
            password: player[0].password
					}
					
          await Sys.App.Services.PlayerServices.updatePlayerData( {_id: req.params.id}, data )
          req.flash('success','Player updated successfully');
          //res.redirect('/playerEdit/'+req.params.id);
          res.redirect(req.session.playerBack);
					return;
          //res.redirect('/player');

        }else {
          req.flash('error', 'No User found');
          res.redirect(req.session.playerBack);
          //res.redirect('/player');
          return;
        }
          // req.flash('success', 'Player Registered successfully');
          // res.redirect('/');
        } catch (e) {
          console.log("Error",e);
        }
  },


  getPlayerDelete: async function(req,res){
    try {
      let player = await Sys.App.Services.PlayerServices.getPlayerData({_id: req.body.id});
      if (player || player.length >0) {
        await Sys.App.Services.PlayerServices.deletePlayer(req.body.id)
        return res.send("success");
      }else {
        return res.send("error");
      }
    } catch (e) {
      console.log("Error",e);
    }
  },

  active: async function(req,res){

    try{

      let player = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id: req.body.id});
      if (player || player.length >0) {
        if(player.status == 'active'){
          await Sys.App.Services.PlayerServices.updatePlayerData(
          {
            _id: req.body.id
          },{
            status:'Block'
          }
          )
        }else{
          await Sys.App.Services.PlayerServices.updatePlayerData(
          {
            _id: req.body.id
          },{
            status:'active'
          }
          )
        }
        //req.flash('success','Status updated successfully');
        return res.send("success");
      }else {
        return res.send("error");
        req.flash('error', 'Problem while updating Status.');
      }

    } catch (e){
      console.log("Error",e);
    }
  },

  inActive: async function(req,res){

    try{

      let player = await Sys.App.Services.PlayerServices.getPlayerData({_id: req.body.id});
      if (player || player.length >0) {

        await Sys.App.Services.PlayerServices.updatePlayerData(
        {
        _id: req.params.id
      },{
        status:'inactive'
      }
      )
        return res.send("success");
      }else {
        return res.send("error");
      }
    } catch (e){
      console.log("Error",e);
    }
  },

  allPlayers: async function(req,res){
    try {
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        allPlayers: 'true',
        playerActive : 'active'
      };
      return res.render('player/player',data);
    } catch (e) {
      console.log("Error",e);
    }
  },

  getAllPlayers: async function(req,res){
    try {
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let search = req.query.search.value;
      let query;
      if (search != '') {
        query = {username: { $regex: '.*' + search + '.*' } };
      }
      
      let playersCount = await Sys.App.Services.PlayerServices.getPlayerCount(query);
      let data = await Sys.App.Services.PlayerServices.getPlayerDatatable(query, length, start);
    
      var obj = {
        'draw': req.query.draw,
        'recordsTotal': playersCount,
        'recordsFiltered': playersCount,
        'data': data,
      };
      res.send(obj);
      } catch (e) {
        console.log("Error",e);
      }
  },

  playerProfile: async function(req, res){
    try{
      let player = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id:req.params.id});
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        playerActive: 'active',
        player: player,
        gamePlayed: 0,
        gamewon: 0,
        gameLost: 0
      };
      
      return res.render('player/profile',data);
    }catch (e){
      console.log("Error",e)
    }
  }

}

async function randomString(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
