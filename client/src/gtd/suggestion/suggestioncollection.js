"use strict";

window.gtd.Suggestion.SuggestionCollection = Backbone.Collection.extend({
	STORE_SCHEMA: {name: 'suggestions', keyPath: 'id'},
	model: window.gtd.Suggestion.Suggestion,
	context: null,
	
	initialize: function(attributes, options) {
		this.context = options.context;
	},
	
	add: function(suggestion) {
		if (_.isArray(suggestion)) {
			return; //Not supported
		}
		var plain = suggestion.toJSON();
		var req = this.context.get('db').put(this.STORE_SCHEMA, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:add', suggestion );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	}

});