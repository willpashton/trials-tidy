var express = require('express');
var router = express.Router();
var axios = require('axios');
const KEY = "c5387eb6cbcd424ca623e290f137b5b1"
const baseURL = 'https://www.bungie.net/Platform';
axios.defaults.headers.common = {
  'X-API-Key': KEY
};
axios.defaults.baseURL = baseURL;

async function playerSearch(namesearch, bungienamecode, page){
  try{
      var hasEnded = true;
      var membtype = 0;
      const response = await axios.post("/User/Search/GlobalName/"+page+"/", {
          displayNamePrefix: namesearch
        });
      var pageitems = response.data['Response']['searchResults'].length;
      for (var i=0; i<pageitems; i++){
          var code = response.data['Response']['searchResults'][i]['bungieGlobalDisplayNameCode'];
          if (code == bungienamecode){
              hasEnded = false;
              code = response.data['Response']['searchResults'][i]['destinyMemberships'][0]['membershipId'];
              membtype =response.data['Response']['searchResults'][i]['destinyMemberships'][0]['membershipType'];
              break;
          }
      }
      var morePages = response.data['Response']['hasMore'];
      if (hasEnded){
          code = "Cannot find player name";
      }
      hasEnded = false;
      const retcode = [code, morePages, membtype];
      return retcode;
  }
  catch (error){
      console.log("Name Search Error");
  }
}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  res.send('respond with a resource');
});
router.post('/', async function(req, res){
    var playerResponse = req.body;
    var playerID = playerResponse['playername'];
    if (playerID.includes('#')){
      var player=playerID.split('#');
      var playerName = player[0];
      var playerNum = parseInt(player[1]);
      var page = -1;
      var morePages = true;
      var message = "";
      var membtype;

      do{

        page++;
        var found = await playerSearch(playerName, playerNum, page);
        if (found[0] == "Cannot find player name"){
          morePages = found[1];
          message = found[0];
        }else{
          morePages = false;
          message = found[0];
          membtype = found[2];
        }

      }while(morePages)

      res.send(message);

    }else{
      res.send("Error");
    }
 });

module.exports = router;
