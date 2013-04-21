"use strict";

window.gtd.Pattern.Pattern = Backbone.Model.extend({

	
	defaults : {
		/* id: -1, */
		'from' : null,
		'content' : null,
		'type' : null,
		'action': null,
		'editable' : true,
		'insensitive'  : true,
		'value' : ''
	},
	
	validate: function(attrs, options) {
		if (!attrs.type) {
			return "Type needs to be defined";
		}
	}
	
});