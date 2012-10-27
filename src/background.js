
var instanceId = 'gmc' + parseInt(Date.now() * Math.random(), 10);

function init() {
	oauth.authorize(function(token, secret) {
		console.log("Authorize - Token:" + token + ", Secret:" + secret);
	});

	var url = 'https://mail.google.com/mail/feed/atom';
	var request = {
		'method' : 'GET',
		'parameters' : {
			'zx' : instanceId
		}
	};

	oauth.sendSignedRequest(url, feedResponse, request);
}

function feedResponse(resp, xhr) {
	var xmlDoc = $.parseXML(resp);
	var $xml = $(xmlDoc);
	var $entries = $xml.find("entry");
	$.each($entries, function(key, value) {
		var title = $(this).find("title").text();
		var summary = $(this).find("summary").text();
		var author_name = $(this).find("author").find("name").text();
		var author_email = $(this).find("author").find("email").text();
		console.log(title, summary, author_name, author_email);
	});
};

document.addEventListener('DOMContentLoaded', init);
