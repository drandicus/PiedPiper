const readline = require("readline");
const salient = require("salient");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var hmm = new salient.tagging.HmmTagger();


var summary = [];


var determiners = []

rl.on("line", (text)=> {
	var sentences = text.split(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g);

	sentences.forEach(function(sentence){
		var words = sentence.split(" ");
		var pos = hmm.tag(words);
		var isPronoun = false;

		var index = (function(pos){
			for(var i=0; i<pos.length; i++){
				if(pos[i] == 'NOUN' || pos[i] == 'PRON'){
					return i;
				}
			}

			//Right now, we assume that if no subject is defined
			//Then it is the first word in the sentence
			return 0;
		})(pos);

		var subject = words[index];

		//This part is all about finding or creating the right summarizer node
		//In the hierachy.
		isPronoun = (pos[index] != "NOUN");

		var added = false;
		if(isPronoun){
			for(var i=summary.length - 1; i>=0; i--){
				var item = summary[i];
				var found = false;
				if(item.attributes.length == 1){
					found = true;
				} else {
					for(var j=0; j<item.attributes.length; j++){
						if(item.attributes[j].indexOf(subject) > -1){
							found = true;
							break;
						}
					}
				}

				if(found){
					item.attributes.push(sentence);
					added = true;
				}
			}
		} else {
			for(var i=summary.length - 1; i>=0; i--){
				var item = summary[i];
				var found = false;
				
				if(subject == item.subject){
					item.attributes.push(sentence);
					added = true;
					break;
				}
			}
		}

		if(!added){
			summary.push({
				subject: subject,
				attributes: [sentence]
			});
		}
	})

	console.log(summary);
});