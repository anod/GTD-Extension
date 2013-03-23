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
			'iconClicked' : false,
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
		
		this.model.on('change:iconClicked',  function(model, value) {
			if (value) {
				this._sendTabOpen();
				this.model.set('iconClicked', false, {silent: true});
			}
		}, this);
		
		this.shortcut.show();

	},
	
	run: function() {	
		this.get('extension').onMessage.addListener(this._message);
		$(window).on('hashchange', _.bind(this._checkUrl, this));
		$(document).bind('keydown', 'shift+a', this._shortcutPress);
		$(document).bind('keydown', 'esc', this._closeAll);
		this._checkUrl();
	},
	
	_closeDialog: function() {
		this.dialog.closeAll();
		this._checkUrl();
	},

	_checkUrl: function() {
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
		if (message && message.action == 'show') {
			this.model.set({ 'suggestion' : message.suggestion });
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
	}
	

});
