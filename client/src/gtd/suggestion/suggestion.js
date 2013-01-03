"use strict";

window.gtd.Suggestion.Suggestion = Backbone.Model.extend({
	
	defaults: {
		id: "", //MsgId
		emailId : 0,
		action: null
	},
	
	initialize: function(attributes, options) {
		if (attributes.action) {
			this.set('action', new window.gtd.Analysis.Action(attributes.action));
		}
	},
	
	/**
	 * @Override
	 */
	toJSON: function() {
		var actionJson = this.get('action').toJSON();
		var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
		json.action = actionJson;
		return json;
	}
	
});