"use strict";

window.gtd.Contentscript.GmailInbox = {
	model: null,
	dialog: null,
	shortcut: null,
	
	run: function() {
		this.model = new Backbone.Model({
			'showDialog' : false,
			'showSuggestion' : false,
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
		this.shortcut = new window.gtd.Contentscript.Shortcut({
			model: this.model
		});
		this.model.on('change:showDialog', function() {
			console.log(arguments);
			//		this.dialog.closeAll();

		}, this);
		this.model.on('change:showSuggestion', function(model, value) {
			if (value) {
				this.shortcut.show();
			} else {
				this.shortcut.hide();
			}
		}, this);
		
		window.chrome.extension.onMessage.addListener(_.bind(this._message, this));
		$(window).on('hashchange', _.bind(this._checkUrl, this));
		this._checkUrl();
	},

	_checkUrl: function() {
		var hash = document.location.hash;
		if (!hash) {
			this._closeAll();
			return false;
		}
		if (hash.length < 2) {
			this._closeAll();
			return false;
		}
		// Detects #inbox/13bc733d5810f7ee in hash and extracts message id
		var match = hash.match(/\/([0-9a-f]+)$/);
		if (!match || match.length < 2) {
			this._closeAll();
			return false;
		}
		var msgId = match[1];
		var message = {
			'action' : 'open',
			'msgId' : msgId 
		};
		this.model.set('showSuggestion',true);
		window.chrome.extension.sendMessage(message);
		return true;
	},
	
	_response: function(resp) {
		console.log(resp);
	},
	
	_message: function(message, sender) {
		if (message && message.action == 'show') {
			this.model.set({ 'suggestion' : message.suggestion });
		}
	},
	
	_showDialog: function(suggestion) {
		this.model.set({
			'suggestion' : suggestion
		});
		this.dialog.render();
	},
	
	_closeAll: function() {
		this.model.set('showDialog', false);
		this.model.set('showSuggestion', false);
	}
	

};

$(document).ready(function() {
	window.gtd.Contentscript.GmailInbox.run();
});

