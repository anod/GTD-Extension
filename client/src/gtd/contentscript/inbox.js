"use strict";

window.gtd = (window.gtd) ? window.gtd : {};
window.gtd.contentscript = (window.gtd.contentscript) ? window.gtd.contentscript : {};
window.gtd.contentscript.GmailInbox = {
	noty: noty,
	run: function() {
		window.chrome.extension.onMessage.addListener(this._message);
		$(window).on('hashchange', this._checkUrl);
		this._checkUrl();
	},

	_checkUrl: function() {
		//var self = window.gtd.contentscript.GmailInbox;
		var hash = document.location.hash;
		if (!hash) {
			return false;
		}
		if (hash.length < 2) {
			return false;
		}
		// Detects #inbox/13bc733d5810f7ee in hash and extracts message id
		var match = hash.match(/\/([0-9a-f]+)$/);
		if (!match || match.length < 2) {
			return false;
		}
		var msgId = match[1];
		var message = {
			'action' : 'open',
			'msgId' : msgId 
		};
		window.chrome.extension.sendMessage(message);
		return true;
	},
	
	_response: function(resp) {
		console.log(resp);
	},
	
	_message: function(message, sender) {
		var self = window.gtd.contentscript.GmailInbox;
		if (message && message.action == 'show') {
			self._showDialog(message.suggestion);
		}
	},
	
	_showDialog: function(suggestion) {
		var n = window.gtd.contentscript.GmailInbox.noty({
			layout: 'bottomCenter',
			type: 'confirm',
			text: suggestion.action.tags.join(','),
			closeWith: ['button'],
			template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
			buttons: [
			{ text: 'Apply', onClick: function($noty){ $noty.close(); }},
			{ text: 'Skip', onClick: function($noty){ $noty.close(); }},
			{ text: 'Not Now', onClick: function($noty){ $noty.close(); }}
			]
		});
	}
};

$(document).ready(function() {
	window.gtd.contentscript.GmailInbox.run();
});

