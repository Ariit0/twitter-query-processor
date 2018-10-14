onload = function twitterFeed() {
	$.get('/twitter-results', function (data) {
		readFeed(data);
	});
}

function sendFormContent () {
	let form = $('#twitter-query');
	let query = form.serialize();
	$.post('/twitter-results', query, function (data) {
		readFeed(data);
	});
}

function readFeed(data) {
	$("#twitter-results").empty();
	for (let i = 0; i < data.length; i++) {
		let msg = data[i];
		let output = '<tr class="msg">';
		output += '<td class="text">' + msg.text+ '</td>';
		output += '</tr>';
		$("#twitter-results").prepend(output);
	}	
}


