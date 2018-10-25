const express = require('express');
const dateFormat = require('dateformat');
const { CLIENT_ID, CLIENT_SECRET, NODE_ENV } = process.env;

const router = express.Router();

const user = require('../schemas/user');
const room = require('../schemas/roomList');
const chat = require('../schemas/chatList');
const read = require('../schemas/read');

const client_id = `${CLIENT_ID}`;
const client_secret = `${CLIENT_SECRET}`;

router.post('/', async (req, res, next) => {
    const loginUser = new user({
        mid : req.body.mid,
        name : req.body.name,
        profile : req.body.profile,
        language : req.body.language,
    })

    try {

        const selectUser = await user.find({mid : req.body.mid});
        
        
        if(selectUser.length == 0){
            loginUser.save();
        }else{
            const updateResult = 
                await user.findOneAndUpdate({ mid : loginUser.mid }, 
                            {name : loginUser.name, profile : loginUser.profile, language : loginUser.language }, 
                            { multi: true, new: true });
            console.log(updateResult);
        }
        res.send('입력완료');
    }catch (error){
        console.error(error);
        next(error);
    }

    
})

router.get('/chat/:mid/room/:room', async (req, res, next) => {
    const mid = req.params.mid;
    const reqroom = req.params.room;
   
    
    try {
        const roomData = await room.findOne({_id : reqroom});
        console.log( roomData.rUserList[0].joinDate);
        const roomInfo = await chat.find({ cRoom : reqroom }).populate('cUser').populate('cRoom').sort('cDate');
        
        var userInfo = [mid, reqroom];
        res.render('chatRoom', {chatLog : roomInfo, userInfo : userInfo});
    } catch (error) {

    }
    
})

router.get('/chat/:mid', async (req, res, next) => {
    const selectUser = await user.find({mid : req.params.mid});

    console.log('유저 : ' + selectUser)
    const rooms = await room.find({ "rUserList.userId" : selectUser[0].id });

    var arr = [];
    var chatarr = [];

    for(var i = 0; i < rooms.length; i++){
        var cnt = await read.find({ rRoom : rooms[i].id, userId : selectUser[0].id ,rStatus : 'N'});
        const lastchat = await chat.find({cRoom : rooms[i].id }).populate('cUser').sort({cDate : -1}).limit(1);
        arr.push(cnt.length);
        chatarr.push(lastchat);
    }
    console.log(chatarr);

        res.render('chattingList', { roomsList : rooms , mid : req.params.mid, cnt : arr, chat : chatarr});

 })

 router.post('/chat/:mid/room/:rId/send', async (req, res, next) => {
    
    
     try{

         const tempmId = req.params.mid;
         var mid = await user.find({mid : tempmId});
         const rId = req.params.rId;
         const txt = req.body.chat;

        console.log(mid);
         if(mid[0].language == "ko"){
            targetLanguage = 'en';
         }else{
            targetLanguage = 'ko';
         }

         var tempUL = await room.find({ _id : rId}).populate('rUserList.userId');
         var userArr = [];

            const chatid = await chat({cContent : txt});
            console.log(chatid);
            
            for(var i = 0; i < tempUL[0].rUserList.length; i++){
                   var temp = tempUL[0].rUserList[i].userId.id;
                   if(tempUL[0].rUserList[i].userId.id != mid[0].id){
                       const readLog = new read({
                           rRoom : rId,
                           rChat : chatid.id,
                           userId : tempUL[0].rUserList[i].userId.id,
                           rStatus : 'N'
                       })
                        readLog.save();
                    }
               }

            const dateVal = await chat.find({cRoom : rId}).sort({cDate : -1}).limit(1);

            var dayval = dateFormat(new Date(), 'yyyy년 mm월 dd일');

        if(dateVal[0] == null || dateVal[0].cDate.getDay() != new Date().getDay()){
            const systemChat = new chat({
                           cUser : '5bb70e6e9adb07137ba6aebd',
                           cRoom : rId,
                           cContent : dayval,
                           cDate : new Date(),
                        })
                       systemChat.save();
            req.app.get('io').of('/chat').to(rId).emit('chat', {txt : dayval, user : 'systemAdmin', mid : 899889988});
        }

        const chattingLog = new chat({
            cUser : mid[0].id,
            cRoom : rId,
            cContent : txt,
            cDate : Date.now(),
           });

        chattingLog.save(); 

        req.app.get('io').of('/chat').to(rId).emit('chat', {txt : txt, user : mid[0].name, mid : mid[0].mid, userLanguage : mid[0].language});
        req.app.get('io').of('/room').emit('news', {txt : txt, user : mid[0].name, rid : rId});

        res.send('ok');
        

    } catch (error){
        console.error(error);
        next(error);
    }
            
 });

 router.patch('/readYN', async (req, res, next) => {
    const mid = req.body.mid;
    const rid = req.body.rid;

    try {

        const userMid = await user.findOne({mid : mid});
        console.log(userMid.id);

        const result = await read.updateMany({rRoom : rid, userId : userMid.id}, {$set : {rStatus : 'Y' }});
        console.log(result);
        
        
        res.send('ok');
    }catch (error){
        console.error(error);
        next(error);
    }

 });

 router.post('/createRoom', async (req, res, next) => {
    title = req.body.title;
    bid = req.body.bid;
    mid = req.body.mid;

    try {
        const chatUser = await user.findOne({ mid : mid});
        
        const result = new room({
            rTitle : title,
            rid : bid,
            rUserList : [{
                userId : chatUser.id,
                joinDate : Date.now()
            }]
        });

        result.save();

        res.send('ok');

    } catch(error){
        console.error(error);
        next(error);
    }       
});

router.post('/startChat', async (req, res, next) => {
    myMid = req.body.mid;
    yourMid = req.body.target;

    try {
        const myMidInfo = await user.findOne({mid : myMid});
        const yourMidInfo = await user.findOne({mid : yourMid});
        console.log(yourMidInfo);

        const result = new room({
            rTitle : `${myMidInfo.name} 과 ${yourMidInfo.name}의 채팅방`,
            rUserList : [{
                userId : myMidInfo.id,
                joinDate : Date.now()
            },
            {
                userId : yourMidInfo.id,
                joinDate : Date.now()
            }]
        });

        result.save();

        res.send(result.id);

    }catch(error){
        console.error(error);
        next(error);
    }
});

router.get('/inviteChat/:mid/:yid', async (req, res, next) => {
    const myMid = req.params.mid;
    const yourMid = req.params.yid;

    try{
        const myUser = await user.findOne({mid : myMid});
        const yourUser = await user.findOne({mid : yourMid});

        const myRoom = await room.find({'rUserList.userId' : myUser.id});
        console.log(myUser);
        console.log(yourUser);
        console.log(myRoom);


        res.render('inviteList', {room : myRoom, mid : myUser.id, userid : yourUser.id});

    }catch(error){
        console.error(error);
        next(error);
    }
});

router.post('/inviteRoom', async (req, res, next) => {
    userId = req.body.userMid;
    roomId = req.body.roomid;
    rId = req.body.rId;
    console.log(userId);
    try{
        const userInfo = await user.findOne({_id : userId});
        const roomInfo = await room.findOne({rid : rId});
        console.log(roomInfo);

        const result = await room.findOneAndUpdate({_id : roomId}, 
                {$push : {rUserList : {userId : userInfo.id, joinDate : Date.now()}}});

        var name = userInfo.name;

        const systemChat = new chat({
            cUser : '5bb70e6e9adb07137ba6aebd',
            cRoom : roomInfo.id,
            cContent : `${name}님이 채팅에 참여합니다.`,
            cDate : new Date(),
         })
        systemChat.save();

        req.app.get('io').of('/chat').to(roomId).emit('chat', {txt : `${name}님이 채팅에 참여합니다.`, user : 'systemAdmin', mid : 0});
        
        
        res.send(roomInfo.id);
    }catch(error){
        console.error(error);
        next(error);
    }


})

router.get('/translateLog', async (req, res, next) => {
    log = req.query.log;
    sourceLanguage = req.query.source;

    var request = require('request');
    var api_url = 'https://openapi.naver.com/v1/papago/n2mt';

    if(sourceLanguage == 'ko'){
        targetLanguage = 'en';
    }else{
        targetLanguage = 'ko'
    }

    var options = {
        url: api_url,
        form: {'source': sourceLanguage, 'target': targetLanguage, 'text':log},
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
     };

     request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            objBody = JSON.parse(response.body);
            console.log(objBody.message.result.translatedText);
        
            res.send(objBody.message.result.translatedText);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
        }
    });
})

router.get('/exitRoom/:user/:room', async (req, res, next) => {
    const userId = req.params.user;
    const roomId = req.params.room;

    try{

        const userInfo = await user.findOne({mid : userId});
        console.log(userInfo);
        
       const result3 = await room.findOneAndUpdate({_id : roomId}, {$pull : {rUserList : {userId : userInfo.id} } });
        
        console.log(result3);
        
       res.redirect(`/chat/${userId}`);

    }catch(error){
        console.error(error);
        next(error);
    }
        
    });

router.post('/insertMember', async (req, res, next) => {
    const mid = req.body.mid;
    const bid = req.body.bid;

    try{
        const userInfo = await user.findOne({mid : mid});
        const roomInfo = await room.findOne({rid : bid});
        console.log(userInfo);
        
        const result = await room.findOneAndUpdate({_id : roomInfo.id}, 
            {$push : {rUserList : {userId : userInfo.id, joinDate : Date.now()}}});

        res.send('가입완료');
        

    }catch(error){
        console.error(error);
        next(error);
    }

    })
    
module.exports = router;