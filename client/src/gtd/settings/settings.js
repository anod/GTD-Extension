"use strict";

window.gtd.Settings.Settings = Backbone.Model.extend({
	db: null,
	
	defaults: {
		enabled: true,
		mode: 1,
		suggestionTreshold: 80
	},
	
	initialize: function(attributes, options) {
		this.db = options.db;
	}

});