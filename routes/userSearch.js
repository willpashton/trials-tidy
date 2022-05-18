var express = require('express');
var router = express.Router();
var axios = require('axios');
const testAccountID = "4611686018483213969";
const KEY = "c5387eb6cbcd424ca623e290f137b5b1";
const baseURL = 'https://www.bungie.net/Platform';
const baseIconURL = 'https://www.bungie.net'
const weaponTypesDict = {"1498876634":"Kinetic", "2465295065":"Energy", "953998645":"Power"};
const weaponImagesDict = {"1498876634":"KineticImage", "2465295065":"EnergyImage", "953998645":"PowerImage"};
axios.defaults.headers.common = {
  'X-API-Key': KEY
};
axios.defaults.baseURL = baseURL;

async function membershipIDConverter(membershipId, membType){
  try{
    const response = await axios.get("/Destiny2/"+membType+"/Profile/"+membershipId+"/?components=100");
    var bungieID = (response.data["Response"]["profile"]["data"]["userInfo"]["bungieGlobalDisplayName"]+
    "#"+response.data["Response"]["profile"]["data"]["userInfo"]["bungieGlobalDisplayNameCode"]);
    return bungieID;
  }
  catch(error){
    console.log("Bungie ID Fetch Error")
  }
}
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
async function weaponRetrieve(membershipId, membType, characterId, userType){
  try{
    var inventoryData = {};
    var inventoryIcon = {};
    const response = await axios.get("/Destiny2/"+membType+"/Profile/"+membershipId+"/Character/"+characterId+"/?components=205");
    for (var i = 0; i < 3; i++){
      var weaponHash = (response.data['Response']['equipment']['data']['items'][i]['itemHash']);
      var weaponType = (response.data['Response']['equipment']['data']['items'][i]['bucketHash']);
      const nameGet = await axios.get("/Destiny2/Manifest/DestinyInventoryItemDefinition/"+weaponHash+"/")
      weaponName = nameGet.data["Response"]["displayProperties"]["name"]
      weaponIcon = nameGet.data["Response"]["displayProperties"]["icon"]
      var key1 = weaponTypesDict[weaponType] + userType;
      var key2 = weaponImagesDict[weaponType] + userType;
      inventoryData[key1] = weaponName;
      inventoryIcon[key2] = baseIconURL+weaponIcon;
    }
    inventoryData = Object.assign({}, inventoryIcon,inventoryData);
    return inventoryData; 
  }
  catch(error){
    console.log("Weapon Fetch Error" + error)
  };
}

async function fireteamRetrieve(membershipId, membType){
  try{
    const response = await axios.get("/Destiny2/"+membType+"/Profile/"+membershipId+"/?components=1000")
    console.log(response)
  }
  catch(error){
    console.log("Fireteam Fetch Error" + error)

  }
}
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
      var characterId = await lastPlayedCharacter(membershipId, membType);
      var inventoryData = await (weaponRetrieve(membershipId,membType,characterId,"User"));


      testdictionaryweiner = {usermessage: membershipId,username: playerID, lastCharacter: characterId};
      var testdictionaryweiner = Object.assign({}, inventoryData,testdictionaryweiner);

      /*var friend_ids = await fireteamRetrieve(membershipId, membType);
      var counter = 0;
      for (String member: friend_ids){
        var characterId = await lastPlayedCharacter(member, 3);
        if (counter == 0){
          var inventoryData = await (weaponRetrieve(member, 3, characterId, First));
          var friendFirst = {firstmessage: membershipId, firstname: playerID, firstCharacter: characterId};
          friendFirst = Object.assign({}, inventoryData, friendFirst);

        }else{
          var inventoryData = await (weaponRetrieve(member, 3, characterId, Second));
          var friendSecond = {secondmessage: membershipId, secondname: playerID, secondCharacter: characterId};
          friendSecond = Object.assign({}, inventoryData, friendSecond);
        }
      }
      testdictionaryweiner = Object.assign({}, friendFirst, testdictionaryweiner);
      testdictionaryweiner = Object.assign({}, friendSecond, testdictionaryweiner);*/
      res.render('userSearch',testdictionaryweiner);

    }else{
      res.send("Error");
    }
  
 });

module.exports = router;
