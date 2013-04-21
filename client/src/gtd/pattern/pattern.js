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
		if (attrs.type === null) {
			return 'Type needs to be defined';
		}
		/*
		TYPE_PROJECT_NAME: 1,
		TYPE_ACTION: 2,
		TYPE_SKIP_ACTION: 3,
		TYPE_CONTEXT: 4,
		*/
		if (attrs.type === 1 || attrs.type === 4) {
			if (!attrs.from || !attrs.content) {
				return 'From or content pattern required';
			}
			if (!attrs.value) {
				return 'Value is required';
			}
		}
		if (attrs.type === 2) {
			if (!attrs.action) {
				return 'Action is required';
			}
		}
		
	}
	
});