"use strict";

window.gtd.Analysis.Action = Backbone.Model.extend({
	db: null,
	
	defaults: {
		actionId: 0,
		titleTags: [],
		summaryTags: []
	},
	
	initialize: function(options) {
		this.db = options.db;
	}
});