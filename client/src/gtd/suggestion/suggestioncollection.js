"use strict";
/**
 * Collection of suggestions
 * @author alex
 */
window.gtd.Suggestion.SuggestionCollection = Backbone.Collection.extend({
	STORE_NAME: 'suggestions',
	model: window.gtd.Suggestion.Suggestion,
	context: null,
	
	/**
	 * @override
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	initialize: function(attributes, options) {
		this.context = options.context;
	},

	/**
	 * Create suggestion from json object
	 * @param json
	 * @returns {window.gtd.Suggestion.Suggestion}
	 */
	fromJSON: function(json) {
		var action = new window.gtd.Analysis.Action(json.action);
		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : json.id,
			'action': action
		});
		return suggestion;
	},
	
	/**
	 * Create suggestion from entry & action
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {window.gtd.Analysis.Action} action
	 * @returns {window.gtd.Suggestion.Suggestion}
	 */
	createSuggestion: function(entry, action) {
		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : entry.get('msgid'),
			'action': action
		});
		return suggestion;
	},
	
	/**
	 * Insert new suggestion into db
	 * @param {window.gtd.Suggestion.Suggestion} suggestion
	 */
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

	/**
	 * Load suggesion by id
	 * @param {Number} id
	 * @param {Object} options
	 * @param {Function} callback
	 */
	load: function(id, options, callback) {
		var self = this;
		this.context.get('db')
			.get(this.STORE_NAME, id)
			.done(function(value) {
				if (_.isObject(value)) {
					callback(value ,options);
				} else {
					callback(null ,options);
				}
			})
			.fail(_.bind(function(error) {
				callback(null ,options);
				this.context.get('logger').exception(error);
			}, this)
		);
	},
	
	/**
	 * Remove suggestion by id
	 * @param {Number} id
	 * @param {Object} options
	 */
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