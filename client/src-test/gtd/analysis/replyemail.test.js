"use strict";
/*global assertNull: true, assertEquals: true */
new TestCase("Analysis.ReplyEmail", {
	context: null,
	actions: null,
	replyemail: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		this.actions = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });
		this.replyemail = new window.gtd.Analysis.ReplyEmail({
			'context' : this.context,
			'actions' : this.actions
		});
	},

	test_createAction: function() {
		var labels = ["GTD/C-Home","GTD/NextAction","GTD/D-2013-04-05"];
		var entry = new Backbone.Model({ 'author_email' : 'email@mail.com', 'author_name' : 'me' });
		var tags =  ['tag1'];
		var actual = this.replyemail._createAction(labels, entry, tags);
		
		var expected = this.actions.createAction(entry, tags);
		expected.set('context', 'Home');
		expected.set('date', '2013-04-05');
		expected.set('label', "GTD/NextAction");
		
		assertEquals("Create action", expected.toJSON(), actual.toJSON());
	}

});