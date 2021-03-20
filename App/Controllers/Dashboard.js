var Sys = require('../../Boot/Sys');
const moment = require('moment');

module.exports = { 
    home: async function(req,res){
        try {

            let latestPalyer = await Sys.App.Services.PlayerServices.getLimitPlayer({});
            for (var m = 0; m < latestPalyer.length; m++) {
                let dt = new Date(latestPalyer[m].createdAt);
                latestPalyer[m].createdAtFormated =moment(dt).format('YYYY/MM/DD');
            }

            // Total game Played
            /* let getTotalGamePlayed = await Sys.App.Services.GameService.getGameCount(); */
            let getTotalPlayer = await Sys.App.Services.PlayerServices.getPlayerCount();
            let getTotalOnlinePlayers = Sys.Io.engine.clientsCount;
            let getTopPlayers = await Sys.App.Services.PlayerServices.getLimitedPlayerWithSort({},5,'chips',-1);
    
            //dates of 31 days
            let endDate =  moment().format("DD MMMM  Y");  // total 31 days report
            let startDate = moment().subtract(30, 'days').format("DD MMMM  Y");

            //START: get running game count 23-08-2019 chirag
            var totalPlayingPly = 0;
            /* var runningRoom = await Sys.App.Services.RoomServices.getRoomData({'status':'Running'});        
            for(var i=0; i<runningRoom.length; i++){
                var roomPlayers = runningRoom[i].players;
                for(var j=0; j<roomPlayers.length; j++){
                    if(roomPlayers[j].status == "Playing"){
                        totalPlayingPly += 1;
                    }
                }
            } */

            console.log("Total playing player: ", totalPlayingPly);
            // console.log("Total running room: ", runningRoom.length);
    
            var data = {
                App : Sys.Config.App.details,
                Agent : req.session.details,
                error: req.flash("error"),
                success: req.flash("success"),
                classActive : 'active',
                user:req.session.details,
                latestPlayer:latestPalyer,
                // totalGamePlayed:module.exports.convertBigNumber(getTotalGamePlayed),
                totalGamePlayed: 0,
                totalPlayer: getTotalPlayer,
                totalOnlinePlayers:getTotalOnlinePlayers,
                topPlayers : getTopPlayers,
                chartStartDate: startDate,
                chartEndDate: endDate,
                totalPlayingPly: totalPlayingPly,
                // totalRunningGame: runningRoom.length,
                totalRunningGame: 0
            };
            return res.render('templates/dashboard',data);            
        } catch (e) {
            console.log("Error",e);
        }
    },


    convertBigNumber:function(number){
        if(number >= 1000000){
            let newValue = number;
            const suffixes = ["", "K", "M", "B","T"];
            let suffixNum = 0;
            while (newValue >= 1000) {
                newValue /= 1000;
                suffixNum++;
            }

            newValue = newValue.toPrecision(3);

            newValue += suffixes[suffixNum];
            return newValue;
        }
        return number;       
    },

    getMonthlyPlayedGameChart:async function(req, res){
            let endDate =  moment().add(1,'days').format("YYYY-MM-DD");  // total 31 days report
            let startDate = moment().subtract(30, 'days').format("YYYY-MM-DD");
            let dateDiff =( moment().diff(moment().subtract(31, 'days')) ); //  because range dont take last value
            console.log("start", startDate);
            console.log("end date", endDate); 
            let query =[{ 
                    $match: { 
                        createdAt: { 
                            $gte: new Date(startDate), 
                            $lt: new Date(endDate) 
                            
                         } 
                    }
                },{
                    $group:{
                        _id:{
                            $add: [
                                { $dayOfYear: "$createdAt"},
                            ]
                        },
                        createdAt: { $first: "$createdAt" },
                        count:{$sum:1}
                    }
                },{
                    $sort:{_id:1}
                }
            ];
            
            let monthlyGamePlayed = await Sys.App.Services.GameService.aggregateQuery(query);            
            let dailyGamePlayedArray = [];
            let dateArray = [];
            for(user of monthlyGamePlayed) {
                console.log("game played**********888", user);
                dailyGamePlayedArray.push(user.count);
                dateArray.push(moment(user.createdAt).format("DD-MM"));
            }
            return res.json({dailyGamePlayedArray: dailyGamePlayedArray, dateArray: dateArray});
    },


    getGameUsageChart: async function(req,res){
        let getTotalPlayer =await Sys.App.Services.PlayerServices.getPlayerCount();
        var platformdataObj={};
        if(getTotalPlayer != 0){
            let platformQuery =[
                {
                    "$group":{
                        "_id":{"platform_os":"$platform_os"},"count":{"$sum":1} //status as platform 
                    }
                },{
                    "$project":{
                        "count":1,
                        "percentage":{
                            "$multiply":[
                                {"$divide":[100,getTotalPlayer]},"$count"
                            ]
                        }

                    }
                }
            ];
            
            let getPlatformdata = await Sys.App.Services.PlayerServices.aggregateQuery(platformQuery);
            console.log("getPlatformdata :",getPlatformdata)
            platformdataObj.android=getPlatformdata.filter(platform => platform._id.platform_os == 'android');
            platformdataObj.ios=getPlatformdata.filter(platform => platform._id.platform_os == 'ios');
            platformdataObj.webCount=getPlatformdata.filter(platform => platform._id.platform_os == 'other' || platform._id.platform_os == null).reduce((partial_sum, a) => partial_sum.count + a.count);
        }
         
        console.log("platform",platformdataObj)
        res.json(platformdataObj);    
    }
    
  
  
}