"use strict";

window.gtdApp = null;
function init() {
	window.oauth.authorize(function() {
		console.log("Authorize - Token:" + window.oauth.getAccessToken());
	});
	window.gtdApp = new window.gtd.Application({
		'gmail': new window.gtd.Gmail.NewList([], { 'oauth': window.oauth }),
		'imap' : new window.gtd.Gmail.Imap({ 'oauth': window.oauth})
	});
	
	window.gtdApp.runBackground();
}

function refresh() {
	if (window.gtdApp) {
		window.gtdApp.runBackground();
	}
}

document.addEventListener('DOMContentLoaded', init);

window.chrome.browserAction.onClicked.addListener(refresh);