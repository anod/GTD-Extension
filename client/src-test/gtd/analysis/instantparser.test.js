"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Analysis.InstantParser", {
	context: null,
	parser: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		this.context.set('actions', new window.gtd.Analysis.ActionCollection([], { 'context' : this.context }));
		var ParserMock = window.gtd.Analysis.InstantParser.extend({
			_createTags: function(text) {
				return text.split(' ');
			}
		});
		this.parser = new ParserMock({ 'context' : this.context });
	},
	
	testTest:function(){
		assertTrue("Match incoming message", this.parser.test(' #gtd '));
		assertFalse("Do not match incoming message", this.parser.test(' alex '));
	},
	
	testParse1:function() {
		
		var src1 = "Buy a milk #gtd #next #date 2013-02-28  #context Creativity thinking #project Very nice prproject titlw";		
		var expected1 = {
			'#gtd' : null,
			'#label' : window.gtd.Label.NEXT_ACTION,
			'#date' : '2013-02-28',
			'#context' : 'Creativity thinking',
			'#project' : 'Very nice prproject titlw',
			'#text' : 'Buy a milk'
		};
		
		var actual1 = this.parser._parse(src1);
		assertEquals('Parse result 1', expected1, actual1);
	},
	
	testParse2: function() {
		var src2 = "Beer #gtd #project Home stuff";		
		var expected2 = {
			'#gtd' : null,
			'#label' : window.gtd.Label.PROJECT,
			'#project' : 'Home stuff',
			'#text' : 'Beer'
		};
		
		var actual2 = this.parser._parse(src2);
		assertEquals('Parse result 2', expected2, actual2);
	},
	
	testParse3: function() {
		var src2 = "Taks subject #gtd #project Vacation June 2013 #next";		
		var expected2 = {
			'#gtd' : null,
			'#label' : window.gtd.Label.NEXT_ACTION,
			'#project' : 'Vacation June 2013',
			'#text' : 'Taks subject'
		};
		
		var actual2 = this.parser._parse(src2);
		assertEquals('Parse result 2', expected2, actual2);
	},
	
	testCreateAction1: function() {
		var actual1 = this.parser._createAction(null, {});
		assertNull(actual1);
	},
	
	testCreateAction2: function() {
		var actual2 = this.parser._createAction(null, { '#label' : 'aa' });
		assertNull(actual2);
	},
	
	testCreateAction3: function() {
		var entry3 = new Backbone.Model({ 'author_email' : 'me@me.com', 'author_name' : 'me' });
		var data3 = {
			'#label' : 'label1',
			'#text' : 'la bo mo',
			'#project' : 'project name',
			'#context' : 'context name',
			'#date' : '2020-10-25'
		};
		var expected3 = new window.gtd.Analysis.Action({
			'label' : 'label1',
			'project' : 'project name',
			'context' : 'context name',
			'date' : '2020-10-25',
			'author_email' : 'me@me.com',
			'author_name' : 'me',
			'tags' : [ 'bo', 'la', 'mo' ]
		});
		var actual3 = this.parser._createAction(entry3, data3);
		assertEquals(expected3.toJSON(),actual3.toJSON());
	}
});