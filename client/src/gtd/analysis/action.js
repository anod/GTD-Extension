"use strict";

window.gtd.Analysis.Action = Backbone.Model.extend({
	db: null,
	
	defaults: {
		emailId: 0,
		actionId: 0,
		subjectTags: [],
		bodyTags: []
	},
	
	initialize: function(options) {
		this.db = options.db;
	}
});