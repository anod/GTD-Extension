"use strict";
/*global assertNull: true, assertEquals: true */
new TestCase("Analysis.NewEmailTest", {
	context: null,
	actions: null,
	newemail: null,
	strikeamatch: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		var settings = new window.gtd.Settings.Settings({}, { 'context' : this.context, 'localStorage' : {} });
		this.context.set('settings', settings);
		this.context.set('extparser', new window.gtd.External.Parser({'context' : this.context}));
		this.context.set('instantparser', new window.gtd.Analysis.InstantParser({'context' : this.context}));
		
		this.actions = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });
		this.strikeamatch = new window.gtd.Analysis.StrikeAMatch();
		this.newemail = new window.gtd.Analysis.NewEmail({
			'context' : this.context,
			'actions' : this.actions,
			'strikeamatch' : this.strikeamatch,
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions })
		});
	},
	
	testMaxSimilarity1:function(){
		var actual = this.newemail._maxSimilarity([], []);
		assertNull("Empty list", actual);
	},
	
	testMaxSimilarity2: function() {
		var list1 = [
			{ tags: [ 'tag1', 'tag2', 'tag3' ] },
			{ tags: [ 'tag1', 'tag2', 'tag3', 'tag4'] },
			{ tags: [ 'tag5', 'tag6'] }
		];

		var actual1 = this.newemail._maxSimilarity(list1, [ 'tag1', 'tag2', 'tag3' ]);
		var expected1 = new window.gtd.Analysis.Action({ tags: [ 'tag1', 'tag2', 'tag3' ] });
		assertEquals("Match by unique tag", expected1.toJSON(), actual1.toJSON());
	},
	
	testMaxSimilarity5: function() {
		var list1 = [
			{ tags: [ 'tag1', 'tag2', 'tag3' ] },
			{ tags: [ 'tag1', 'tag2', 'tag3', 'tag4'] },
			{ tags: [ 'tag5', 'tag6'] }
		];
		
		var actual2 = this.newemail._maxSimilarity(list1, [ 'tag1', 'tag2', 'tag3', 'tag4']);
		var expected2 = new window.gtd.Analysis.Action({ tags: [ 'tag1', 'tag2', 'tag3', 'tag4'] });
		assertEquals("Match by unique tag", expected2.toJSON(), actual2.toJSON());
	},
	
	testMaxSimilarity3: function() {
		var list1 = [
			{ tags: [ 'tag1', 'tag2', 'tag3' ] },
			{ tags: [ 'tag4', 'tag5', 'tag7', 'tag9'] },
			{ tags: [ 'tag5', 'tag6', 'tag8'] }
		];
		var actual3 = this.newemail._maxSimilarity(list1, [ 'tag5', 'tag6' ]);
		var expected2 = new window.gtd.Analysis.Action({ tags:[ 'tag5', 'tag6', 'tag8'] });
		assertEquals("Match by unique tag", expected2.toJSON(), actual3.toJSON());
	},
	
	testMaxSimilarity4: function() {
		var list1 = [
			{ tags: [ 'tag1', 'tag2', 'tag3' ] },
			{ tags: [ 'tag1', 'tag2', 'tag3', 'tag4'] },
			{ tags: [ 'tag5', 'tag6'] }
		];
		var actual3 = this.newemail._maxSimilarity(list1, [ 'tag7' ]);
		assertNull("Empty list", actual3);
	},
	
	
	testAnalyse1: function() {

		var NewEmail = window.gtd.Analysis.NewEmail.extend({
			exitPoint: '',
			
			_processExternal: function(entry) {
				this.exitPoint = '_processExternal';
			},
			
			_processInstant: function(entry) {
				this.exitPoint = '_processInstant';
			},
			
			_checkReplyEmail: function(entry, tags) {
				this.exitPoint = '_checkReplyEmail';
			}
		});
		
		var newmail1 = new NewEmail({ 
			'context' : this.context, 
			'actions' : this.actions, 
			'strikeamatch' : this.strikeamatch, 
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions })
		});
		newmail1.analyse(new Backbone.Model({ 'title' : '#gtd #mailid'}));
		assertEquals('_processExternal', newmail1.exitPoint);
	},
	
	testAnalyse2: function() {
		
		var NewEmail = window.gtd.Analysis.NewEmail.extend({
			exitPoint: '',
			
			_processExternal: function(entry) {
				this.exitPoint = '_processExternal';
			},
			
			_processInstant: function(entry) {
				this.exitPoint = '_processInstant';
			},
			
			_checkReplyEmail: function(entry, tags) {
				this.exitPoint = '_checkReplyEmail';
			}
		});
		
		var newmail2 = new NewEmail({ 
			'context' : this.context, 
			'actions' : this.actions, 
			'strikeamatch' : this.strikeamatch, 
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions })
		});
		newmail2.analyse(new Backbone.Model({ 'title' : 'Blabla #gtd'}));
		assertEquals('_processInstant', newmail2.exitPoint);
	},
	
	testAnalyse3: function() {
		
		var SuggestionCollection = {
			load: function(id, options, callback) {
				callback(null);
			}
		};
		
		
		var NewEmail = window.gtd.Analysis.NewEmail.extend({
			exitPoint: '',
			
			_processExternal: function(entry) {
				this.exitPoint = '_processExternal';
			},
			
			_processInstant: function(entry) {
				this.exitPoint = '_processInstant';
			},
			
			_checkReplyEmail: function(entry, tags) {
				this.exitPoint = '_checkReplyEmail';
			}
		});
		
		var newmail3 = new NewEmail({ 
			'context' : this.context, 
			'actions' : this.actions, 
			'strikeamatch' : this.strikeamatch, 
			'suggestions' : SuggestionCollection,
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions }),
			'termextraction' : new window.gtd.Analysis.TermExtraction(),
			'tagfilter' : new window.gtd.Analysis.TagFilter({'userinfo' : new Backbone.Model({'given_name': 'a', 'family_name' : 'b'})})
		});
		newmail3.analyse(new Backbone.Model({ 'title' : 'Blabla Holly', 'summary': 'Wood!'}));
		assertEquals('_checkReplyEmail', newmail3.exitPoint);
	},
	
	testSearchResult1: function() {
		var NewEmail = window.gtd.Analysis.NewEmail.extend({
			exitPoint: '',
			similarAction: null,
			
			_maxSimilarity: function(similarList, tags) {
				return this.similarAction;
			},
			
			_applyAction: function(mailId, action, silent) {
				this.exitPoint = '_applyAction';
			},
			
			_fillAction: function(entry, tags) {
				this.exitPoint = '_fillAction';
			}
		});
		
		var newmail1 = new NewEmail({ 
			'context' : this.context, 
			'actions' : this.actions, 
			'strikeamatch' : this.strikeamatch, 
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions })
		});
		newmail1._searchResult([], null, []);
		assertEquals('_fillAction', newmail1.exitPoint);
	},
	
	testSearchResult2: function() {
		var NewEmail = window.gtd.Analysis.NewEmail.extend({
			exitPoint: '',
			similarAction: null,
			
			_maxSimilarity: function(similarList, tags) {
				return this.similarAction;
			},
			
			_applyAction: function(mailId, action, silent) {
				this.exitPoint = '_applyAction';
			},
			
			_fillAction: function(entry, tags) {
				this.exitPoint = '_fillAction';
			}
		});
		
		var newmail2= new NewEmail({ 
			'context' : this.context, 
			'actions' : this.actions, 
			'strikeamatch' : this.strikeamatch, 
			'replyemail' : new window.gtd.Analysis.ReplyEmail({ 'context' : this.context, 'actions' : this.actions })
		});
		newmail2.similarAction = new Backbone.Model({ 'tags' : ['c']});
		newmail2._searchResult([ 'a' ], new Backbone.Model({ 'mailid' : 27}), [ 'b' ]);
		assertEquals('_applyAction', newmail2.exitPoint);
		
	}
});