"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true */
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

	testCreateAction1: function() {
		var labels = ["GTD/C-Home","GTD/NextAction","GTD/D-2013-04-05", "GTD/P-World"];
		var entry = new Backbone.Model({ 'author_email' : 'email@mail.com', 'author_name' : 'me' });
		var tags =  ['tag1'];
		var actual = this.replyemail._createAction(labels, entry, tags);
		
		var expected = this.actions.createAction(entry, tags);
		expected.set('context', 'Home');
		expected.set('date', '2013-04-05');
		expected.set('label', "GTD/NextAction");
		expected.set('project', "World");
		
		assertEquals("Create action", expected.toJSON(), actual.toJSON());
	},
	
	testCreateAction2: function() {
		var entry = new Backbone.Model({ 'author_email' : 'email@mail.com', 'author_name' : 'me' });
		var tags =  ['tag1'];

		var actual1 = this.replyemail._createAction([], entry, tags);
		assertNull(actual1);
	},
	
	testCheck: function() {
		var imap = {
			getThreadLabels : function(msgid, callback) {
				callback(null);
			}
		};
		this.context.set('imap', imap);
		var finish = false;
		this.replyemail.on('check:finish', function() {
			finish = true;
		});
		this.replyemail.check(new Backbone.Model({'msgid' : 123}), []);
		assertTrue(finish);
	}

});