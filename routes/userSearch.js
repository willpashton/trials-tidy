var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.post('/', function(req, res){
    var playerResponse = req.body;
    var playerID = playerResponse['playername'];
    var player=playerID.split('#');
    var playerName = player[0];
    var playerNum = parseInt(player[1]);
    res.send(playerName+' '+playerNum);
 });

module.exports = router;
