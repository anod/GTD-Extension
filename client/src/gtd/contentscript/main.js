"use strict";
// Start Gmail Inbox Controller
$(document).ready(function() {
	var inbox = new window.gtd.Contentscript.GmailInbox({
		'extension' : window.chrome.extension
	});
	inbox.run();
});