"use strict";

window.gtd.Contentscript.GmailInbox = Backbone.Model.extend({
	model: null,
	dialog: null,
	shortcut: null,
	
	defaults: {
		extension: null
	},
	
	initialize: function() {
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
		this.model.on('change:showDialog', function(model, value) {
			if (value) {
				this.dialog.render();
			} else {
				this.dialog.closeAll();
			}
		}, this);
		this.model.on('change:showSuggestion', function(model, value) {
			if (value) {
				this.shortcut.show();
			} else {
				this.shortcut.hide();
			}
		}, this);

	},
	
	run: function() {	
		this.get('extension').onMessage.addListener(_.bind(this._message, this));
		$(window).on('hashchange', _.bind(this._checkUrl, this));
		$(document).bind('keydown', 'shift+a', _.bind(this._shortcutPress, this));
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
		this.get('extension').sendMessage(message);
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
	
	_shortcutPress: function() {
		this.model.set('showDialog', true);
		this.model.set('showSuggestion', false);
	},
		
	_closeAll: function() {
		this.model.set('showDialog', false);
		this.model.set('showSuggestion', false);
	}
	

});
