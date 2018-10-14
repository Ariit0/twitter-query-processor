onload = function twitterFeed() {
	$.get('/twitter-results', function (data) {
		readFeed(data);
	});

	$.get('/trending-tags', function (data) {
		var output = '<tr><td class="text">';

		data.forEach(function (tag) {
			output += '<button type="button" class="btn btn-outline-dark btn-sm">' + tag + '</button>';
		});
		output += '</td></tr>';
		$("#trending-tags").prepend(output);
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


