"use strict";

window.gtd = (window.gtd) ? window.gtd : {};
window.gtd.Contentscript = (window.gtd.Contentscript) ? window.gtd.Contentscript : {};
window.gtd.Contentscript.GmailInbox = {
	model: null,
	dialog: null,
	
	run: function() {
		this.model = new Backbone.Model({
			'visible' : false,
			'suggestion' : null,
			'label' : 'GTD-NextAction',
			'date' : '2013-05-01',
			'context' : 'Study',
			'project' : 'GTD',
			'priority' : ''
		});
		this.dialog = new window.gtd.Contentscript.Dialog({
			model: this.model
		});
		window.chrome.extension.onMessage.addListener(this._message);
		$(window).on('hashchange', this._checkUrl);
		this._checkUrl();
	},

	_checkUrl: function() {
		var self = window.gtd.Contentscript.GmailInbox;
		var hash = document.location.hash;
		if (!hash) {
			self._closeAll();
			return false;
		}
		if (hash.length < 2) {
			self._closeAll();
			return false;
		}
		// Detects #inbox/13bc733d5810f7ee in hash and extracts message id
		var match = hash.match(/\/([0-9a-f]+)$/);
		if (!match || match.length < 2) {
			self._closeAll();
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
		var self = window.gtd.Contentscript.GmailInbox;
		if (message && message.action == 'show') {
			self._showDialog(message.suggestion);
		}
	},
	
	_showDialog: function(suggestion) {
		this.model.set({
			'suggestion' : suggestion
		});
		this.dialog.render();
	},
	
	_closeAll: function() {
		this.dialog.closeAll();
	}
	

};

$(document).ready(function() {
	window.gtd.Contentscript.GmailInbox.run();
});

