/* DOM Altering Code */
var summarizeActive = false;
var isRecording = false;

$('#summarize').click(function(e){
	summarizeActive = !summarizeActive;

	if(summarizeActive){
		$('.transcript').addClass("half");
		$('.keyboard').addClass("key-half");
		setTimeout(function(){
			$('.summary').addClass('visible')
		}, 1000)
		
	} else {
		$('.summary').removeClass('visible');
		setTimeout(function(){
			$('.transcript').removeClass("half");
			$('.keyboard').removeClass("key-half");
		}, 1000)
	}
})

$('#record').click(function(e){
	isRecording = !isRecording;

	if(!isRecording){
		stopRecording();
	} else {
		startRecording();
	}
})

/* Voice Recognition Software */
var recognition = null
var final_transcript = "";
var oldStopPoint = 0;
var recognizing = false;


$('#keyboard').bind("keyup", function(e){
	if (e.keyCode === 13) {
		var newSentence = $('#keyboard').val();
		if(newSentence.slice(-1)){
			newSentence += ". "
		}
		$('#keyboard').val("");
		displayNewText(newSentence);
    }
})

$(document).ready(function(){
	if (!('webkitSpeechRecognition' in window)) {
	  upgrade();
	} else {

	  recognition = new webkitSpeechRecognition();
	  recognition.continuous = true;
	  recognition.interimResults = false;

	  recognition.onstart = onStart
	  recognition.onresult = onResult
	  recognition.onerror = error
	  recognition.onend = onEnd
	}
});

var startRecording = function(){
	if(recognizing){
		recognition.stop();
	}

	recognition.lang = "en-US";
  	recognition.start();
}

var stopRecording = function(){
	recognizing = false;
	recognition.stop();
}

var onStart = function(){
	recognizing = true;
}

var onResult = function(event){

	oldStopPoint = final_transcript.split(" ").length - 1;
    for (var i = event.resultIndex; i < event.results.length; ++i) {
    	final_transcript += event.results[i][0].transcript;
	}

	final_transcript += ". ";
	displayNewText();
}

var error = function(e){
	var errorMessage = "";
	if(event.error == "no-speech"){
		errorMessage = "No Speech Available";
	} else if (event.error == "audio-capture"){
		errorMessage = "Audio Capture not working";
	} else if (event.error == "not-allowed"){
		errorMessage = "Voice Recognizer not allowed on this computer";
	}

	alert(errorMessage);
}

var onEnd = function(){
	recognizing = false;
}

var displayNewText = function(sentence){
	var arr = sentence.split(" ");
	var newPart = [];
	//$('#text').html("<div class='caption'>Transcript</div>")
	$('#text').append("<br/><br/>");

	for(var i=0; i<arr.length; i++){
		$('#text').append(arr[i]);
		$('#text').append(" ");
	}

	$.post('/api/pos', {sentence: sentence})
	.done(function(data){
		console.log(data);
		summarizeText(sentence, data);
	 });
}

/* Summarization Area */

var summary = [];
var oldSummaryPoint = 0;
function summarizeText(sentence, pos){
	var words = sentence.split(" ");
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
		console.log("is a pronoun");
		for(var i=summary.length - 1; i>=0; i--){
			var item = summary[i];
			console.log(item.subject);
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
				break;
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

	if(summarizeActive){
		displaySummary();
	}
}

function displaySummary(){
	console.log(summary);
	$('#summary').html("<div id='summary-caption' class='caption'>Summary</div>");
	for(var i = 0; i<summary.length; i++){
		var content = "<p class='subject-word'>" + summary[i].subject + "</p>";
		for(var j=0; j<summary[i].attributes.length; j++){
			content += "<p class='attribute'>" + summary[i].attributes[j] + "</p>";
		}
		content += "<br>"
		$("#summary").append(content);
	}

}