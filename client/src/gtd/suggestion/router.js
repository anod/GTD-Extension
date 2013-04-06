"use strict";

window.gtd.Suggestion.Router = Backbone.Model.extend({
	
	defaults : {
		context: null,
		suggestions: null
	},
	
	initialize: function(attributes, options) {
		this.get('suggestions').on('load:done', this._emailLoaded, this);
	},
	
	route: function(message, options) {
		if (message.action == 'open') {
			this._emailOpen(message.msgId, options);
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
			var settings = this.get('context').get('settings').toJSON();
			this.get('context').trigger('message:send', options, 'newSettings', { 'settings': settings });
		}
	},

	_emailOpen: function(msgId, options) {
		this.get('suggestions').load(msgId, options);
	},
	
	_emailLoaded: function(suggestion, options) {
		this.get('context').trigger('message:send', options, 'show', {'suggestion': suggestion});
	},
	
	_openTab: function(msgId) {
		var url = window.gtd.External.Api.ACTION_LINK + msgId;
		this.get('context').get('chrome').tabs.create({
			'url' : url,
			'active' : true
		});
	}
});