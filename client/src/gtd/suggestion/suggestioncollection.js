"use strict";

window.gtd.Suggestion.SuggestionCollection = Backbone.Collection.extend({
	STORE_NAME: 'suggestions',
	model: window.gtd.Suggestion.Suggestion,
	context: null,
	
	initialize: function(attributes, options) {
		this.context = options.context;
	},

	fromJSON: function(json) {
		var action = new window.gtd.Analysis.Action(json.action);
		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : json.id,
			'action': action
		});
		return suggestion;
	},
	
	createSuggestion: function(entry, action) {
		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : entry.get('msgid'),
			'action': action
		});
		return suggestion;
	},
	
	insertDb: function(suggestion) {
		if (_.isArray(suggestion)) {
			return; //Not supported
		}
		var plain = suggestion.toJSON();
		var db =this.context.get('db');
		var req = db.put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:insertdb', suggestion );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	},

	load: function(id, options) {
		var self = this;
		this.context.get('db')
			.get(this.STORE_NAME, id)
			.done(function(value) {
				if (_.isObject(value)) {
					self.trigger('load:done', value ,options);
				}
			})
			.fail(_.bind(function(error) {
				this.context.get('logger').exception(error);
			}, this)
		);
	},
	
	remove: function(id, options) {
		var self = this;
		this.context.get('db')
			.remove(this.STORE_NAME, id)
			.done(function() {
				self.trigger('remove:done', options);
			})
			.fail(_.bind(function(error) {
				this.context.get('logger').exception(error);
			}, this)
		);
	}
	
});