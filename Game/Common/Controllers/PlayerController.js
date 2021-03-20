var Sys = require('../../../Boot/Sys');
var bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
var jwtcofig = {
  'secret': 'PokerTiles'
};
var defaultTransport = nodemailer.createTransport({
 service: 'Gmail',
 auth: {
   user: Sys.Config.App.mailer.auth.user,
   pass: Sys.Config.App.mailer.auth.pass
 }
});

module.exports = {

  playerRegister: async function (socket, data){
    try {
      console.log("SYS",Sys.Setting)
      if(Sys.Setting.maintenance.status =='active'){
        return {
          status: 'fail',
          result: null,
          message: Sys.Setting.maintenance.message,
          statusCode: 400
        }
      }

      // Check Username Already Available
      let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ username: data.username });
      if (player) { // When Player Found
        return {
          status: 'fail',
          result: null,
          message: 'Username already taken.',
          statusCode: 401
        }
      }

      // Check Email Already Available
      player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ email: data.email });
      if (player) { // When Player Found
        return {
          status: 'fail',
          result: null,
          message: 'Email already taken.',
          statusCode: 401
        }
      }

      // Create Player Object
      let playerObj = {
        username: data.username,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
        device_id: data.device_id,
        chips: Sys.Setting.defaultChips,
        profilePic: 0,
        socketId: '1234',
        platform_os: data.os
      };
      player = await Sys.Game.Common.Services.PlayerServices.create(playerObj);

      if (!player) {
        return {
          status: 'fail',
          result: null,
          message: 'Something went wrong while creating player.',
          statusCode: 400
        }
      }else{        
        return {
          status: 'success',
          result: {
            playerId    : player.id,
            username    : player.username,
            chips       : player.chips
          },
          message: 'Player Successfully Registered!'
        }
      }
    } catch (e) {
      console.log('Error in create Player :', e);
      return {
        status: 'fail',
        result: null,
        message: 'Server error.',
        statusCode: 500
      }
    }
  },

  playerLogin: async function(socket, data){
    try {
      if(Sys.Setting.maintenance.status =='active'){
          return {
            status: 'fail',
            result: null,
            message: Sys.Setting.maintenance.message,
            statusCode: 400
          } 
      }

      data.isFbLogin = false; // Remove After Testing.
      let passwordTrue = false;
      let player = null;

      if (data.isFbLogin == false) { // if Normal Login
        // Define Validation Rules
        let playerObj = {
          $or:[
            { username: data.username },
            { email: data.username }
          ]
        };

        player = await Sys.Game.Common.Services.PlayerServices.getOneByData(playerObj);
        if(!player){
          return {
            status: 'fail',
            result: null,
            message: 'Wrong Username Or Email',
            statusCode: 400
          }
        }

        if(bcrypt.compareSync(data.password, player.password)) {
          //check if player is Active or Blocked 
          if(player.status == 'Block'){
            return {
              status: 'fail',
              result: null,
              message: 'Oops You are Blocked,please Contact Administrator.',
              statusCode: 400
            }
          }
          passwordTrue = true;
        }
      } else {
        let playerObj = {
          isFbLogin: true,
          appId: data.appId
        };

        player = await Sys.Game.Common.Services.PlayerServices.getOneByData(playerObj);
        if(!player){
          playerObj = {
            deviceId: data.deviceId,
            isFbLogin: true,
            username: player.username,
            appId: data.appId,
            deviceId: data.deviceId,
            chips: 1000,
            status: 'active',
            platform_os: data.os,
          };

          player = await Sys.Game.Common.Services.PlayerServices.create(playerObj);
          if (!player) {
            return {
              status: 'fail',
              result: null,
              message: 'Player Not Created',
              statusCode: 400
            }
          }
        }
        passwordTrue = true;
      }

      if (passwordTrue) {
        console.log("data.forceLogin", data.forceLogin);
        if(data.forceLogin){
          if(player.socketId){
            console.log("Player Force Logout Send.");
            await Sys.Io.to(player.socketId).emit('forceLogOut', {
              playerId:  player.id,
              message: "You are logged off due to login from another device.",
            });
          }
        } else {
          if(Sys.Io.sockets.connected[player.socketId]) { 
            console.log("socket is already connected");
            return {
              status: 'fail',
              message: 'alreadyLogin',
            } 
          }
        }

        player.isFbLogin = false;
        if (data.AppId != '') {
          player.isFbLogin = true;
        }

        await Sys.Game.Common.Services.PlayerServices.updatePlayerData({
          _id: player.id
        },{
          socketId: socket.id,
          platform_os: data.os
        });
        console.log("player socket id on login", socket.id, player.username);
        
        return {
          status: 'success',
          result: {
            playerId: player.id,
            username: player.username,
            chips: player.chips,
            profilePic: player.profilePic,
            profilePicUrl : player.avatar,
            socketId: socket.id
          },
          message: 'Player Successfully Login!'
        }
      }

      return {
        status: 'fail',
        result: null,
        message: 'Invalid credentials!',
        statusCode: 401
      }
    } catch (error) {
      Sys.Log.info('Error in Login : ', error);
      return {
        status: 'fail',
        result: null,
        message: 'Server Error.',
        statusCode: 400
      }
    }
  },

  reconnectPlayer: async function(socket,data){
    try {
      if(data.playerId){
        let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({_id: data.playerId},'socketId',null);
        console.log("reconnect player", player);
        if (Sys.Io.sockets.connected[player.socketId]) { 
          console.log("socket is already connected in reconnect player");
          await Sys.Io.to(socket.id).emit('forceLogOut',{
                playerId :  player.id,
                message: "You are logged off due to login from another device.",
          });
        
          return {
            status: 'fail',
            message: "forceLogout",
          }
        }
              
        await Sys.Game.Common.Services.PlayerServices.updatePlayerData({  
          _id: data.playerId   
        },{
            socketId: socket.id
        });

        return {
          status: 'success',
          result: null,
          message: 'Player Reconnect Success!'
        }
      } else {
        return {
            status: 'success',
            result: null,
            message: 'Player Reconnect Failed!'
        }
      }
    } catch (error) {
          Sys.Log.info('Error in reconnectPlayer : ' + error);
          return {
            status: 'fail',
            result: null,
            message: 'No Running Game Found!',
          }
    }
  },

  changeUsername: async function(socket,data){
    try {
      var isUserName = await Sys.Game.Common.Services.PlayerServices.getOneByData({ username: data.newUsername });
      
      if(isUserName == null){
        let updatedPlayer = false;
        updatedPlayer = await Sys.Game.Common.Services.PlayerServices.update({_id: data.playerId},{ username:data.newUsername });
        if (updatedPlayer) {
          let playerData = await Sys.Game.Common.Services.PlayerServices.getOneByData({ id: data.playerId });
          return {status: 'success',result: playerData,message: 'Player Profile Successfully Updated!'}
        }
      }else{
        return {status: 'fail',result: null,message: 'Username already exists',statusCode: 400}
      }
    } catch (error) {
      Sys.Log.info('Error in change username : ' + error);
      return {status: 'fail',result: null,message: 'No Player Found!',statusCode: 400}
    }
  },

  playerLogout: async function(socket,data){
    try {
      await Sys.Game.Common.Services.PlayerServices.update({
        _id: data.playerId
      },{
          socketId : ''
      });
      return {
        status: 'success',
        result: null,
        message: 'Player logout successfully',
        statusCode: 200
      }
    } catch (error) {
      Sys.Log.info('Error in Logout Player : ' + error);
    }
  },

  playerProfile: async function(socket, data){
    try{
      let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ _id: data.playerId });
      if(player){
        
        return {
          status: 'success',
          result: {
            playerId : player.id,
            email : player.email,
            username : player.username,
            avatar : player.profilePic,
            profilePicUrl : player.avatar,
            chips: player.chips
          },
          message: 'Player Data Found'
        }
      }
      return {
        status: 'fail',
        result: null,
        message: 'Player Not Found',
        statusCode: 400
      }
    }catch(e){
      Sys.Log.info('Error in getting player profile : ' + e);
    }
  },

  playerForgotPassword: async function(socket, data){
    try{
      let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ email: data.email });
      console.log("HOST", socket.handshake.headers.host )
      if(player){
        var token = jwt.sign({ id: data.email }, jwtcofig.secret, {
          expiresIn: 300 // expires in 5 minutes
        });
  
        let resetTokenData = {
          resetPasswordToken: token,
          resetPasswordExpires: Date.now() + (1000*60*5) // add 5 minutes into current time
        }
        console.log("Date.now()", Date.now());
        console.log("resetTokenData", resetTokenData);
        console.log("player id",player._id);
        let check = await Sys.App.Services.PlayerServices.updatePlayerData({
          _id: player._id
        }, resetTokenData);
        let supportMessage  = "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tHello\r\nWelcomes to the Team Poker Tiles Team Support Link\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tYou are receiving this because you (or someone else) have requested the reset of the password for your account.\r\n          Please click on the following link, or paste this into your browser to complete the process:\r\n          <token>\r\n\t If you did'nt request for password, mail our support system, we will get back you sortly!\t\t\r\nThanks\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t"

        let textMessage = supportMessage.trim();
        let mailText = textMessage.replace( "<token>", 'https://' + socket.handshake.headers.host + '/web/reset-password.html?t=' + token );
        let mailOptions = {
          to: data.email,
          from: 'Poker Tiles',
          subject: 'Poker Tiles Password Reset',
          text: mailText
        };
        let emailMessage = "";
        defaultTransport.sendMail(mailOptions,  function(error) {
          if(error){
                emailMessage = "there was an error :-(, and it was this: " + error.message;
          }else{
                emailMessage = "Email sent with new Password.";
          }     

        });
        return {
                status: "success",
                message: "Email sent with new Password."
           }

      }else{
        return {
          status: 'fail',
          result: null,
          message: 'Player Not Found.',
          statusCode: 400
        }
      }
      
    }catch(e){
      Sys.Log.info('Error in playerForgotPassword : ' + e);
    }
  },

  playerChangePassword: async function(socket, data){
    try{
      let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ _id: data.playerId });
      if(player){
        if(bcrypt.compareSync(data.oldPassword, player.password)) {
          if(data.verifyNewPassword.length >= 6){
            if(data.newPassword == data.verifyNewPassword){
              await Sys.Game.Common.Services.PlayerServices.updatePlayerData({
                _id: data.playerId
              }, {
                password : bcrypt.hashSync(data.newPassword, bcrypt.genSaltSync(8), null)
              });
              return {
                status: 'success',
                message: "Password Updated Successfully",
                statusCode: 200,
              }
            }else{
              return {
                status: 'fail',
                result: null,
                message: 'New password and verify password mismatch.',
                statusCode: 400
              }
            }
          }
          return {
                status: 'fail',
                result: null,
                message: 'Password must be more than six characters',
                statusCode: 400
          }
        } else {
          return {
            status: 'fail',
            result: null,
            message: 'Please provide correct old password.',
            statusCode: 400
          }
        }
      }
      return {
        status: 'fail',
        result: null,
        message: 'Player Not Found.',
        statusCode: 400
      }
    }catch(e){
      Sys.Log.info('Error in playerChangePassword : ' + e);
    }
  },

  playerPicUpdate: async function(socket, data){
    try{
      let player = await Sys.Game.Common.Services.PlayerServices.getOneByData({ _id: data.playerId });
      if(player){
       await Sys.Game.Common.Services.PlayerServices.updatePlayerData({
         _id: data.playerId
       }, {
         profilePic: data.profilePic,
         avatar : null
       });
       return {
         status: 'success',
         message: "Profile Updated Successfully.",
         statusCode: 200,
       }
      }
      return {
        status: 'fail',
        result: null,
        message: 'Player Not Found.',
        statusCode: 400
      }
    }catch(e){
      Sys.Log.info('Error in playerPicUpdate : ' + e);
    }
  },
}
