"use strict";

window.gtd.Pattern.PatternCollection = Backbone.Collection.extend({
	STORE_NAME: 'patterns',
	context: null,
	
	initialize: function(model, options) {
		this.context = options.context;
	},
	
	match: function(entry, tags) {
		
	},
	
	createPattern: function(match, type, attribute) {
		var pattern = new window.gtd.Pattern.Pattern({
			'match' : match,
			'type' : type,
			'attribute': attribute
		});
		return pattern;
	},
	
	add: function(pattern) {
		if (_.isArray(pattern)) {
			return; //Not supported
		}
		var plain = pattern.toJSON();
		var req = this.context.get('db').put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:add', pattern );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	}
});