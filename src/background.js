
var gtdController = null;
function init() {
	oauth.authorize(function(token, secret) {
		console.log("Authorize - Token:" + token + ", Secret:" + secret);
	});

	gtdController = new gtd.Controller({
		'oauth': oauth,
		'chrome': chrome,
		'gmail': new gtd.Gmail.NewList([], { 'oauth': oauth })
	});
	
	gtdController.runBackground();	
}

document.addEventListener('DOMContentLoaded', init);
