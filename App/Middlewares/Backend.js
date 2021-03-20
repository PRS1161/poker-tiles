var Sys = require('../../Boot/Sys');
var jwt = require('jsonwebtoken');

const flatCache = require('flat-cache'); 
let cache = flatCache.load('dashboardCache');

var jwtcofig = {
  'secret': 'PokerTiles'
};

module.exports = {
    loginCheck:  function(req, res, next){
        if(req.session.login){
            
            res.redirect('/dashboard');
        }else{
            next();
        }
    }, 
    // auth
    Authenticate: async function(req, res, next){
        if(req.session.login){           
            let adminChips = await Sys.App.Services.UserServices.getSingleUserData({_id: req.session.details.id});
            req.session.details.chips = adminChips.chips;  
            jwt.verify(req.session.details.jwt_token, jwtcofig.secret, async function(err, decoded) {
                if (err){
                    req.session.destroy(function(err) {
                        req.logout();
                        return res.redirect('/admin');
                    })
                }else{
                    res.locals.session = req.session.details;                            
                    next();
                }

            });
        }else{
            res.redirect('/admin');
        }
    },

    HasRole: function(...allowed){
        const isAllowed = role => allowed.indexOf(role) > -1;
        return function(req, res, next) {
            if (!isAllowed(req.session.details.role)){
                req.flash('error', 'You are Not allowed to access that page.');
                return res.redirect('/player');
            }
            else next();
        }
    },

    flatCacheMiddleware: function(req,res, next){
            let key =  '__express__' + req.originalUrl || req.url
            let cacheContent = cache.getKey(key);
            if( cacheContent){
                res.send( cacheContent );
            }else{
                res.sendResponse = res.send
                res.send = (body) => {
                    cache.setKey(key,body);
                    cache.save();
                    res.sendResponse(body)
                }
                next()
            }
    },
}