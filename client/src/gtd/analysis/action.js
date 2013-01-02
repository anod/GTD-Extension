"use strict";

window.gtd.Analysis.Action = Backbone.Model.extend({
	UNKNOWN: 0,
	NEXT_ACTION: 1,
	PROJECT: 2,
	WAITING_FOR: 3,
	CALENDAR: 4,
	
	defaults: {
		/* id: -1, */
		action: 0,
		label: '',
		deadline: -1,
		name: '',
		//
		author_name: '',
		author_email: '',
		tags: []
	}

});