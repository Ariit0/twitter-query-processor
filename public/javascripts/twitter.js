onload = function twitterFeed() {
	$.get('/twitter-results', function (data) {
		readFeed(data);
	});
	// Execute function once onload
	// Sends a post request to twitter API to get trending tags and store results in middleware
	if (sessionStorage.getItem('oneTime') === null) {
		$.post('/trending-tags', function (data) {
			readTags(data);
		});
		sessionStorage.setItem('oneTime', 'no');
	}
	// Sends a get request for trending tags from middleware
	$.get('/trending-tags', function (data) {
		readTags(data);
	});

	// Refresh page after all requests have been completed (1000ms to process)
	if (sessionStorage.getItem('once') === null) {
		setTimeout(function() {location.reload();}, 1000);
		sessionStorage.setItem('once', 'no');
	}
}
/**
 * Generates HTML ouput for trending tags
 */
function readTags(data) {
	var output = '<tr><td class="text">';

	data.forEach(function (tag) {
		output += '<button type="button" class="btn btn-outline-dark btn-sm">' + tag + '</button>';
	});
	output += '</td></tr>';
	$("#trending-tags").prepend(output);
}
/**
 * Function called for the onsubmit event when performing a search query
 */
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


