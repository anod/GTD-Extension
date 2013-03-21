"use strict";

window.gtd.Pattern.Pattern = Backbone.Model.extend({
	TYPE_DATE: 0,
	TYPE_PROJECT_NAME: 1,
	TYPE_ACTION: 2,
	TYPE_SKIP_TAG: 3,
	TYPE_CONTEXT: 4,
	
	defaults : {
		/* id: -1, */
		'from' : null,
		'subject' : null,
		'summary' : null,
		'content' : null,
		'type' : null,
		'action': null
	}
	
});