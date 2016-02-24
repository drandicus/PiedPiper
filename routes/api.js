var express = require('express');
var router = express.Router();

var salient = require("salient");
var hmm = new salient.tagging.HmmTagger();

router.post('/pos', function(req, res, next){
	var sentence = req.body['sentence'];
	var words = sentence.split(" ");
	var pos = hmm.tag(words);

	res.json(pos);
})

module.exports = router;