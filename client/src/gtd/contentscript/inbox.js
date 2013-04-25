"use strict";

window.gtd.Contentscript.GmailInbox = Backbone.Model.extend({
	model: null,
	dialog: null,
	shortcut: null,
	
	defaults: {
		extension: null
	},
	
	initialize: function() {
		_.bindAll(this,'_closeDialog', '_shortcutPress', '_message', '_closeAll');
		this.model = new Backbone.Model({
			'highlightDialog' : false,
			'showDialog' : false,
			'insideEmail' : false,
			'openMsgId' : 0,
			'suggestion' : null,
			'label' : window.gtd.Label.NEXT_ACTION,
			'date' : '',
			'context' : '',
			'project' : '',
			'priority' : '',
			'tags' : [],
			'settings' : null
		});
		this.dialog = new window.gtd.Contentscript.Dialog({
			model: this.model
		});
		this.shortcut = new window.gtd.Contentscript.Shortcut({
			model: this.model
		});
		this.model.on('change:highlightDialog', function(model, value) {
			if (value) {
				this.dialog.highlight();
				model.set('highlightDialog', false, {silent: true});
				return;
			}
		}, this);
		this.model.on('change:showDialog', function(model, value) {
			if (value) {
				this.dialog.render();
			} else {
				this._closeDialog();
			}
		}, this);
		
		this.model.on('shortcut:clicked',  function() {
			this._sendTabOpen();
		}, this);
	},
	
	run: function() {
		this.get('extension').onMessage.addListener(this._message);
		this.get('extension').sendMessage( { 'action' : 'getSettings' } );
	},
	
	_closeDialog: function() {
		this.dialog.closeAll();
		this._checkUrl();
	},

	_checkUrl: function() {
		this.model.set({
			'label': window.gtd.Label.NEXT_ACTION,
			'date' : '',
			'context' : '',
			'project' : '',
			'tags' : ''
		});
		
		if (!this.model.get('settings').enabled) {
			this.model.set('insideEmail', false);
			this._closeAll();
			return false;
		}
		
		var hash = document.location.hash;
		if (!hash) {
			this.model.set('insideEmail', false);
			this._closeAll();
			return false;
		}
		if (hash.length < 2) {
			this.model.set('insideEmail', false);
			this._closeAll();
			return false;
		}
		// Detects #inbox/13bc733d5810f7ee in hash and extracts message id
		var match = hash.match(/\/([0-9a-f]+)$/);
		if (!match || match.length < 2) {
			this.model.set('insideEmail', false);
			this._closeAll();
			return false;
		}
		var msgId = match[1];
		var message = {
			'action' : 'open',
			'msgId' : msgId 
		};
		this.model.set('openMsgId', msgId);
		this.model.set('insideEmail', true);
		this.get('extension').sendMessage(message);
		return true;
	},
	
	_sendTabOpen: function() {
		var msgId = (this.model.get('insideEmail')) ? this.model.get('openMsgId') : 0;
		var message = {
			'action' : 'openTab',
			'msgId' : msgId 
		};
		console.log(message);
		this.get('extension').sendMessage(message);
	},
	
	_response: function(resp) {
		console.log(resp);
	},
	
	_message: function(message, sender) {
		if (!message) {
			return;
		}
		console.log('Incomming message', message);
		if (message.action == 'show') {
			this.model.set({ 'suggestion' : message.suggestion });
			var action = message.suggestion.action;
			if (action) {
				this.model.set({
					'label': (action.label) ? action.label : window.gtd.Label.NEXT_ACTION,
					'date' : action.date,
					'context' : action.context,
					'project' : action.project,
					'tags' : action.tags
				});
			}
		} else if (message.action == 'newSettings') {
			this._onNewSettings(message.settings);
		}
	},
	
	_shortcutPress: function() {
		if (!this.model.get('insideEmail')) {
			return;
		}
		if (this.model.get('showDialog')) {
			this.model.set('highlightDialog', true);
			return;
		}
		this.model.set('showDialog', true);
	},
		
	_closeAll: function() {
		this.model.set('showDialog', false);
	},
	
	_onNewSettings: function(json) {
		var init = (this.model.get('settings') === null);
		this.model.set('settings', json);

		$(document).unbind('keydown', this._shortcutPress);
		$(document).unbind('keydown', this._closeAll);
		
		var hotkey = json.hotkey;
		$(document).bind('keydown', hotkey, this._shortcutPress);
		$(document).bind('keydown', 'esc', this._closeAll);
		
		this.shortcut.show();
		if (init) {
			$(window).on('hashchange', _.bind(this._checkUrl, this));
			this._checkUrl();
		}
	}
});
