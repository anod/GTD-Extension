"use strict";

window.gtdController = null;
function init() {
	window.oauth.authorize(function(token, secret) {
		console.log("Authorize - Token:" + token + ", Secret:" + secret);
	});

	window.gtdController = new window.gtd.Controller({
		'oauth': window.oauth,
		'chrome': window.chrome,
		'gmail': new window.gtd.Gmail.NewList([], { 'oauth': window.oauth })
	});
	
	window.gtdController.runBackground();	
}

function refresh() {
	if (window.gtdController) {
		window.gtdController.runBackground();
	}
}

document.addEventListener('DOMContentLoaded', init);

window.chrome.browserAction.onClicked.addListener(refresh);