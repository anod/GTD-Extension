"use strict";

window.gtd.Suggestion.Suggestion = Backbone.Model.extend({
	
	defaults: {
		id: -1,
		emailId : 0,
		msgId : 0,
		action: null
	}
});