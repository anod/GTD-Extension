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
			var suggestion = new window.gtd.Suggestion.Suggestion(message.suggestion);
			this.get('suggestions').remove(suggestion.get('id'), options);
			this.get('context').trigger('suggestion:apply:label', suggestion);
			return;
		}
	},

	_emailOpen: function(msgId, options) {
		this.get('suggestions').load(msgId, options);
	},
	
	_emailLoaded: function(suggestion, options) {
		this.trigger('suggestion:show', suggestion, options);
	}
});