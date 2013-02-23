"use strict";

window.gtd.Analysis.Action = Backbone.Model.extend({
	UNKNOWN: 0,
	NEXT_ACTION: 1,
	PROJECT: 2,
	WAITING_FOR: 3,
	CALENDAR: 4,
	SOMEDAY: 5,
	
	defaults: {
		/* id: -1, */
		action: 0,
		label: '',
		project: '',
		deadline: '',
		start_date: '',
		context: '',
		name: '',
		//
		author_name: '',
		author_email: '',
		tags: []
	}

});