var validate = require('express-validation');
var Joi = require('joi');
module.exports = {
    loginPostValidate: function(req, res, next){
        //console.log('Validation check:', req.body);
        const rulesSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required()
        });
        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: false,
            abortEarly: false
        });

        if (ret.error) {
            // res.status(400).end(ret.error.toString());
            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());
            res.redirect('/admin');
        } else {
            next();
        }
    },
    
    registerUserPostValidate: function(req, res, next){
       // console.log('Validation check:', req.body);
        const rulesSchema = Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            status: Joi.string().min(3).max(30).required(),
            role: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required()
            // image: Joi.required()
        });

        const data = {
          username: 'abcd1234',
          status: 'abc1',
          role: 'Joe',
          email: 'not_a_valid_email_to_show_custom_label',
          password : '123456'
        };

        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: false,
            abortEarly: false
        });

        if (ret.error) {
            // res.status(400).end(ret.error.toString());
            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());
            // console.log('ret.error', ret.error.toString());
            res.redirect('/addUser');
        } else {
            next();
        }
    },

    editUserPostValidate: function(req, res, next){
        //console.log('Validation check:', req.body);
        const rulesSchema = Joi.object({
           username: Joi.string().alphanum().min(3).max(30).required(),
            status: Joi.string().min(3).max(30).required(),
            role: Joi.string().min(3).max(30).required(),
            // email: Joi.string().email().required(),
            // password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required()
            // image: Joi
        });

        const data = {
          username: 'abcd1234',
          status: 'abc1',
          role: 'Joe',
          // email: 'not_a_valid_email_to_show_custom_label',
          password : '123456'
        };

        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: false,
            abortEarly: false
        });

        if (ret.error) {
            // res.status(400).end(ret.error.toString());
            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());
            // console.log('ret.error', ret.error.toString());
            res.redirect('/user');
        } else {
            next();
        }
    },


    /***

    Player Validation
    ------------------

    ***/

    registerPlayerPostValidate: function(req, res, next){
        //console.log('Validation check:', req.body);
        const rulesSchema = Joi.object({
          email: Joi.string().email().required(),
          username: Joi.string().alphanum().max(30).required(),
          password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required()
        });

        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: false,
            abortEarly: false
        });

        if (ret.error) {
            // res.status(400).end(ret.error.toString());
            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());
            // console.log('ret.error', ret.error.toString());
            res.redirect('/addPlayer');
        } else {
            next();
        }
    },


    editPlayerPostValidate: function(req, res, next){
        //console.log('Validation check:', req.body);
        const rulesSchema = Joi.object({
          username: Joi.string().alphanum().max(30).required(),
          email: Joi.string().email().required()
        });

        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: false,
            abortEarly: false
        });

        if (ret.error) {
            // res.status(400).end(ret.error.toString());
            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());
            // console.log('ret.error', ret.error.toString());
            res.redirect('/player');
        } else {
            next();
        }
    },

    // Setting Validation

    settingsValidation: function(req,res,next){

        const rulesSchema = Joi.object({
           chips: Joi.number().required(),
           id : Joi
        });
        const ret = Joi.validate(req.body, rulesSchema, {
            allowUnknown: true,
            abortEarly: false
        });

        if (ret.error) {

            console.log("Error",ret.error.toString());
            req.flash('error', ret.error.toString());

            res.redirect('/settings');
        } else {
            next();
        }
    },

}
