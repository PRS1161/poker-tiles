var express = require('express'), router = express.Router();
var Sys = require('../../Boot/Sys');

// add passport modules for social media integration
const passport = require('passport');
const passport_conf=require('../../Config/passport')(passport);

// Load Your Cutom Middlewares
router.get('/backend',Sys.App.Middlewares.Frontend.frontRequestCheck, function(req, res) {
	res.send('This is Backend');
});



/**
 * Auth Router
 */
// router.get('/',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Controllers.Auth.login);
// router.post('/',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Middlewares.Validator.loginPostValidate,Sys.App.Controllers.Auth.postLogin);

router.get('/admin',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Controllers.Auth.login);
router.post('/admin',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Middlewares.Validator.loginPostValidate,Sys.App.Controllers.Auth.postLogin);

router.get('/forgot-password',Sys.App.Controllers.Auth.forgotPassword);
router.post('/forgot-password',Sys.App.Controllers.Auth.forgotPasswordSendMail);
router.get('/reset-password/:token',Sys.App.Controllers.Auth.resetPassword);
router.post('/reset-password/:token',Sys.App.Controllers.Auth.postResetPassword);
router.get('/logout',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Controllers.Auth.logout);


router.get('/register',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.register);

router.get('/profile',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.profile);

router.post('/profile/update',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.profileUpdate);

router.post('/profile/changePwd',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.changePassword);

router.post('/profile/changeAvatar',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.changeAvatar);

/**
 * Dashboard Router
 */
router.get('/dashboard',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Dashboard.home);

/**
 * User Router
 */
 router.get('/user',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.UserController.users);
 router.get('/user/getUser',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.UserController.getUser);

 router.get('/addUser',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.UserController.addUser);
 // post data can beobtained by req.body.<parameter_name>
 router.post('/addUser',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'), Sys.App.Middlewares.Validator.registerUserPostValidate, Sys.App.Controllers.UserController.addUserPostData);
 router.post('/user/getUserDelete',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Controllers.UserController.getUserDelete);

// here mentioned id is fetched as req.params.id
 router.get('/userEdit/:id/',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.UserController.editUser);
 router.post('/userEdit/:id',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'), Sys.App.Middlewares.Validator.editUserPostValidate,Sys.App.Controllers.UserController.editUserPostData);

router.get('/test/testing',Sys.App.Middlewares.Backend.loginCheck,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.Auth.login);

/***

	Player Route
	------------
****/
router.get('/allPlayers',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.allPlayers);

router.get('/player/getAllPlayers',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.getAllPlayers);

router.get('/addPlayer',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.addPlayer);

router.post('/addPlayer',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'), Sys.App.Middlewares.Validator.registerPlayerPostValidate, Sys.App.Controllers.PlayerController.addPlayerPostData);

router.get('/playerEdit/:id/',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.editPlayer);

router.post('/playerEdit/:id',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'), Sys.App.Middlewares.Validator.editPlayerPostValidate,Sys.App.Controllers.PlayerController.editPlayerPostData);

router.post('/player/getPlayerDelete',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.getPlayerDelete);

router.post('/player/active',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.active);

router.post('/player/inActive',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.inActive);

router.get('/player/profile/:id',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin','master','agent','childAgent'),Sys.App.Controllers.PlayerController.playerProfile);
/***

	Settings Route

**/

router.post('/settings/add',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Middlewares.Validator.settingsValidation,Sys.App.Controllers.SettingsController.settingsAdd);

router.get('/settings',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.settings);

router.post('/settings/update',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Middlewares.Validator.settingsValidation,Sys.App.Controllers.SettingsController.settingsUpdate);

router.get('/maintenance',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.maintenance);

//router.post('/maintenance/statusChange',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.maintenanceStatusChange);

router.get('/maintenance/edit/:id',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.editMaintenance);
router.post('/maintenance/edit/:id',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.updateMaintenance);
router.post('/maintenance/restartServer',Sys.App.Middlewares.Backend.Authenticate,Sys.App.Middlewares.Backend.HasRole('admin'),Sys.App.Controllers.SettingsController.restartServer);
/***

	maintenance and DailyReports Route

**/

router.get('/dashboardChart/getMonthlyPlayedGameChart', Sys.App.Controllers.Dashboard.getMonthlyPlayedGameChart);

router.get('/dashboardChart/getGameUsageChart', Sys.App.Controllers.Dashboard.getGameUsageChart);

/**
 * Rest Api Routes Ends Here
 */

module.exports = router
