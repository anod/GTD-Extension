"use strict";

window.gtd.Suggestion.Router = Backbone.Model.extend({
	
	defaults : {
		context: null,
		suggestions: null
	},
	
	initialize: function(attributes, options) {
		this.get('suggestions').on('load:done', this._emailLoaded, this);
	},
	
	emailOpen: function(msgId, options) {
		this.get('suggestions').load(msgId, options);
	},
	
	_emailLoaded: function(suggestion, options) {
		this.trigger('suggestion:show', suggestion, options);
	}
	
	
});