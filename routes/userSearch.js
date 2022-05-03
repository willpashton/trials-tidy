var express = require('express');
var router = express.Router();
var axios = require('axios');
const KEY = "c5387eb6cbcd424ca623e290f137b5b1";
const baseURL = 'https://www.bungie.net/Platform';
const weaponTypesDict = {"1498876634":"Kinetic", "2465295065":"Energy", "953998645":"Power"};
var equippedWeapons = {};
axios.defaults.headers.common = {
  'X-API-Key': KEY
};
axios.defaults.baseURL = baseURL;

async function character(membershipId, membType){
  try{
      const response = await axios.get("/Destiny2/"+membType+"/Profile/"+membershipId+"/?components=200");
      var characterData = response.data["Response"]["characters"]["data"]
      return characterData;
  }
  catch(error){
      console.log("Character Fetch Error")
  }
}
async function lastPlayedCharacter(membershipId, membType){
  lastPlayed = {}
  lastPlayedCompare = new Date('1999-01-12')
  try{
      //console.log("/Destiny2/"+membType+"/Account/"+membershipId+"/Character/"
      //+characterId+"/Stats/Activities/?count=1&page=0")
      const characterData = await character(membershipId, membType);
      for (const [key, value] of Object.entries(characterData)){
        var rawLastPlayed = value['dateLastPlayed']
        console.log(new Date(rawLastPlayed));
        if (lastPlayedCompare < (new Date(rawLastPlayed))){
            lastPlayedCompare = (new Date(rawLastPlayed))
        };
        lastPlayed[new Date(rawLastPlayed)] = key;
      };
      var lastPlayedCharacterId = lastPlayed[lastPlayedCompare]
      return lastPlayedCharacterId;
  }
  catch (error){
      console.log("Error with last activity")
  }
}
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

router.post('/', async function(req, res){
    var playerResponse = req.body;
    var playerID = playerResponse['playername'];
    if (playerID.includes('#')){
      var player=playerID.split('#');
      var playerName = player[0];
      var playerNum = parseInt(player[1]);
      var page = -1;
      var morePages = true;
      var membershipId = "";
      var membType;

      do{

        page++;
        var found = await playerSearch(playerName, playerNum, page);
        if (found[0] == "Cannot find player name"){
          morePages = found[1];
          membershipId = found[0];
        }else{
          morePages = false;
          membershipId = found[0];
          membType = found[2];
        }

      }while(morePages)
      var lastPlayedCharacterReturn = await lastPlayedCharacter(membershipId, membType)
      testdictionaryweiner = {usermessage: membershipId,username: playerID, lastCharacter: lastPlayedCharacterReturn}
      res.render('userSearch',testdictionaryweiner);

    }else{
      res.send("Error");
    }
  
 });

module.exports = router;
