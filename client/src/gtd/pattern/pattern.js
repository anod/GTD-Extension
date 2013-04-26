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
	
	errors: {
		TYPE: 'Type needs to be selected',
		FROM_OR_CONTENT: 'From or content pattern are required',
		VALUE: 'Value is required',
		ACTION: 'Action is required'
	},
	
	validate: function(attrs, options) {
		if (!attrs.type || attrs.type === null) {
			return this.errors.TYPE;
		}
		/*
		TYPE_PROJECT_NAME: 1,
		TYPE_ACTION: 2,
		TYPE_SKIP_ACTION: 3,
		TYPE_CONTEXT: 4,
		*/
		if (attrs.type === 1 || attrs.type === 4) {
			if (!attrs.from && !attrs.content) {
				return this.errors.FROM_OR_CONTENT;
			}
			if (!attrs.value) {
				return this.errors.VALUE;
			}
		}
		if (attrs.type === 2) {
			if (!attrs.action) {
				return this.errors.ACTION;
			}
		}
		
	}
	
});