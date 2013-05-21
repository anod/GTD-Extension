"use strict";
/**
 * Describes action suggestion to specific email
 * @author alex
 */
window.gtd.Suggestion.Suggestion = Backbone.Model.extend({
	
	defaults: {
		id: "", //MsgId
		action: null
	},
	
	/**
	 * @override
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	initialize: function(attributes, options) {

	},
	
	/**
	 * @override
	 */
	toJSON: function() {
		var action = this.get('action');
		var actionJson = action.toJSON();
		var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
		json.action = actionJson;
		return json;
	}
	
});