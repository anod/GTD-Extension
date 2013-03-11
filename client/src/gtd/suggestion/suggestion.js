"use strict";

window.gtd.Suggestion.Suggestion = Backbone.Model.extend({
	
	defaults: {
		id: "", //MsgId
		action: null
	},
	
	initialize: function(attributes, options) {

	},
	
	/**
	 * @Override
	 */
	toJSON: function() {
		var action = this.get('action');
		var actionJson = action.toJSON();
		var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
		json.action = actionJson;
		return json;
	}
	
});