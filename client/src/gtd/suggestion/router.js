"use strict";

window.gtd.Suggestion.Router = Backbone.Model.extend({
	
	defaults : {
		context: null,
		suggestions: null
	},
	
	initialize: function(attributes, options) {

	},
	
	route: function(message, options) {
		if (message.action == 'open') {
			this._emailOpen(message.msgId, options);
			return;
		}
		if (message.action == 'checkEmails') {
			this.get('context').trigger('check:newemails');
			return;
		}
		if (message.action == 'apply') {
			var suggestion = this.get('suggestions').fromJSON(message.suggestion);
			this.get('suggestions').remove(suggestion.get('id'), options);
			this.get('context').trigger('suggestion:apply', suggestion);
			return;
		}
		if (message.action == 'openTab') {
			this._openTab(message.msgId);
		}
		if (message.action == 'getSettings') {
			this._sendSettings(options);
		}
		if (message.action == 'refreshSettings') {
			var tabOptions = options;
			this.get('context').get('settings').fetch();
			this.get('context').get('chrome').tabs.query({ url: 'https://mail.google.com/mail/*' }, _.bind(function(tabs) {
				for (var i = 0; i< tabs.length; i++) {
					var tab = tabs[i];
					tabOptions.tabId = tab.id;
					this._sendSettings(tabOptions);
				}
			}, this));
		}
	},
	
	_sendSettings: function(options) {
		var settings = this.get('context').get('settings').toJSON();
		this.get('context').trigger('message:send', options, 'newSettings', { 'settings': settings });
	},
	
	_emailOpen: function(msgId, options) {
		this.get('suggestions').load(msgId, options, function(suggestion, options) {
			if (!suggestion) {
				return;
			}
			this.get('context').trigger('message:send', options, 'show', {'suggestion': suggestion});
		});
	},
	_openTab: function(msgId) {
		var url = window.gtd.External.Api.ACTION_LINK + msgId;
		this.get('context').get('chrome').tabs.create({
			'url' : url,
			'active' : true
		});
	}
});