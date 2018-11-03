onload = function twitterFeed() {
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
 * Establish socket.io connetion once the webpage is ready
 */
$('document').ready(function() {
	console.log('Loaded');
	// connect socket client
	var socket = io();
	$('#sub').click(function() {
		$('#twitter-results').empty();
		socket.emit('keyword', {keyword: $('#keyword').val()});
	});

	socket.on('livetweets', function(data) {
		var tweet = data.data;
		let output = '<tr>';
		output += '<td>' + tweet.text + '</td>';
		output += '<td>' + emojifyScore(tweet.score) + '</td>';
		output += '</tr>';
		$('#twitter-results').prepend(output);
	});
});

/**
 * Generates HTML ouput for trending tags
 */
function readTags(data) {
	var output = '<tr>';

	data.forEach(function (tag) {
		output += '<td class="text"><button type="button" value="'+ tag +'" class="btn btn-outline-dark btn-sm" onClick="autoFill(this);">' + tag + '</button></td>';
	});
	output += '</tr>';
	$("#trending-tags").prepend(output);
}

function emojifyScore(score) {
	var emoji;

	if(score < 0) {
		emoji = "😰";
	} else if(score > 0) {
		emoji = "🙂";
	} else {
		emoji = "😑";
	}
	return emoji;
}

function autoFill(buttonObject) {
	if(!$("#keyword").val()) {
		$("#keyword").val(buttonObject.value);
	} else {
		$("#keyword").val($("#keyword").val() + "," + buttonObject.value);
	}
}