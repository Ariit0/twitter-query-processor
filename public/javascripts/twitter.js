onload = function twitterFeed() {
	$.get('/twitter-results', function (data) {
		readFeed(data);
	});
}

/**
 * Reload page after post request (2 second delay)
 */
function reloadPage() {
	setTimeout(function(){window.location.reload(true);}, 2000);
}

function sendFormContent () {
	let form = $('#twitter-query');
	let query = form.serialize();
	$.post('/twitter-results', query, function (data) {
		readFeed(data);
	});

	// reload page
	//window.location.reload(true);
}

function readFeed(data) {
	for (let i = 0; i < data.length; i++) {
		let msg = data[i];
		let output = '<tr class="msg">';
		output += '<td class="text">' + msg.text+ '</td>';
		output += '</tr>';
		$("#twitter-results").prepend(output);
	}	
}


