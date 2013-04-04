"use strict";
/*global assertNull: true, assertEquals: true */
new TestCase("Analysis.ReplyEmail", {
	context: null,
	actions: null,
	newemail: null,
	strikeamatch: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		this.actions = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });
		this.strikeamatch = new window.gtd.Analysis.StrikeAMatch();
		this.newemail = new window.gtd.Analysis.ReplyEmail({
			'context' : this.context,
			'actions' : this.actions
		});
	},

	test_createAction: function() {
		var labels = ["GTD/C-Home","GTD/NextAction","GTD/D-2013-04-05"];
		// TODO
	}

});