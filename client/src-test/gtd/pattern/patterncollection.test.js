"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Pattern.PatternCollection", {
	context: null,
	patterns: null,
	newemail: null,
	strikeamatch: null,
	
	setUp: function() {
		var dateutils = {
			getThisWeekend: function() { return 'getThisWeekend'; },
			getNextWeekend: function() { return 'getNextWeekend'; },
			getToday: function() { return 'getToday'; },
			getTomorrow: function() { return 'getTomorrow'; },
			getNextWeek: function() { return 'getNextWeek'; },
			getNextMonth: function() { return 'getNextMonth'; },
			parseDate: function() { return 'parseDate'; }
		};
		this.context = new window.gtd.Context({
			'logger' : console,
			'settings' : new Backbone.Model({ 'firstTime' : false }),
			'dateutils' : dateutils
		});
		
		this.patterns = new window.gtd.Pattern.PatternCollection([], { 'context' : this.context });

	},
	
	_testPatternDate: function(title, expected) {
		var json = this.patterns._initPatterns[0];
		var pattern = new window.gtd.Pattern.Pattern(json);
		
		var entry = new Backbone.Model({ 'title' : title, 'summary' : ''});
		this.patterns._testPattern(pattern, entry);
		var match = pattern.get('data');
		var actual = (match && match[0]) ? match[0][0] : null;
		assertEquals(expected,actual);
	},
	
	testPatternDate1: function() {
		this._testPatternDate('Buy milk this weekend', 'this weekend');
	},
	testPatternDate2: function() {
		this._testPatternDate('Buy milk tomorrow', 'tomorrow');
	},
	testPatternDate3: function() {
		this._testPatternDate('Buy milk this or next  weekend', 'next  weekend');
	},
	testPatternDate4: function() {
		this._testPatternDate('Buy milk today', 'today');
	},
	testPatternDate5: function() {
		this._testPatternDate('Call Peter today at 7pm', 'today' );
	},
	testPatternDate6: function() {
		this._testPatternDate('no date related stuff here', null );
	},
	testPatternDate7: function() {
		this._testPatternDate('Order pizza next week', 'next week' );
	},
	testPatternDate8: function() {
		this._testPatternDate('Fly to Barcelona next month with family', 'next month' );
	},
	testPatternDate9: function() {
		this._testPatternDate('Finish project until 1/5', '1/5' );
	},
	testPatternDate10: function() {
		this._testPatternDate('Save day at 20/07', '20/07' );
	},
	testPatternDate11: function() {
		this._testPatternDate('Cancel subscription at 1-7-2013', '1-7-2013' );
	},
	testPatternDate12: function() {
		this._testPatternDate('Cancel subscription at 08-11-2013', '08-11-2013' );
	},
	
	testMatchToAction1: function() {
		assertEquals("", this.patterns._matchToAction([]));
	},
	testMatchToAction2: function() {
		assertEquals(window.gtd.Label.NEXT_ACTION, this.patterns._matchToAction(['Next Action']));
	},
	testMatchToAction3: function() {
		assertEquals(window.gtd.Label.PROJECT, this.patterns._matchToAction(['Project']));
	},
	testMatchToAction4: function() {
		assertEquals(window.gtd.Label.WAITINGFOR, this.patterns._matchToAction(['Waiting For']));
	},
	testMatchToAction5: function() {
		assertEquals(window.gtd.Label.CALENDAR, this.patterns._matchToAction(['Calendar']));
	},
	testMatchToAction6: function() {
		assertEquals(window.gtd.Label.SOMEDAY, this.patterns._matchToAction(['Someday']));
	},

	testMatchToProject1: function() {
		assertEquals("", this.patterns._matchToProject([]));
	},
	
	testMatchToProject2: function() {
		assertEquals("Vasya", this.patterns._matchToProject(['Project Vasya']));
	},
	
	testMatchToContext1: function() {
		assertEquals("", this.patterns._matchToContext([]));
	},

	testMatchToContext2: function() {
		assertEquals("Video", this.patterns._matchToContext(['youtube.com']));
	},

	testMatchToContext3: function() {
		assertEquals("Study", this.patterns._matchToContext(['Context Study']));
	},
	
	testMatchToDate1: function() {
		assertNull(this.patterns._matchToDate([]));
	},

	testMatchToDate2: function() {
		assertEquals('getThisWeekend', this.patterns._matchToDate(['Weekend']));
	},

	testMatchToDate3: function() {
		assertEquals('getThisWeekend', this.patterns._matchToDate(['this weekend']));
	},
	
	testMatchToDate4: function() {
		assertEquals('getThisWeekend', this.patterns._matchToDate(['this weekend']));
	},
	testMatchToDate5: function() {
		assertEquals('getThisWeekend', this.patterns._matchToDate(['this weekend']));
	},
	testMatchToDate6: function() {
		assertEquals('getNextWeekend', this.patterns._matchToDate(['Next weekend']));
	},
	testMatchToDate7: function() {
		assertEquals('getToday', this.patterns._matchToDate(['today']));
	},
	testMatchToDate8: function() {
		assertEquals('getTomorrow', this.patterns._matchToDate(['tomorrow']));
	},
	testMatchToDate9: function() {
		assertEquals('getNextWeek', this.patterns._matchToDate(['next week']));
	},
	testMatchToDate10: function() {
		assertEquals('getNextMonth', this.patterns._matchToDate(['next month']));
	},
	testMatchToDate11: function() {
		assertEquals('parseDate', this.patterns._matchToDate(['2010/12/25']));
	},

	testApplyPattern1: function() {
		var PatternCollection = window.gtd.Pattern.PatternCollection.extend({
			initialize: function() {},
			_matchToDate: function(match) { return '2020-12-12'; }
		});
		
		var collection = new PatternCollection();
		var action = new Backbone.Model();
		collection._applyPattern(new Backbone.Model({'type' : collection.TYPE_DATE, 'data' : ['date'] }), null, action);
		assertEquals('2020-12-12', action.get('date'));
	},
	
	testApplyPattern2: function() {
		var PatternCollection = window.gtd.Pattern.PatternCollection.extend({
			initialize: function() {},
			_matchToProject: function(match) { return 'Blabla'; }
		});
		
		var collection = new PatternCollection();
		var action = new Backbone.Model();
		collection._applyPattern(new Backbone.Model({'type' : collection.TYPE_PROJECT_NAME, 'data' : [''] }), null, action);
		assertEquals('Blabla', action.get('project'));
	},
	
	testApplyPattern3: function() {
		var PatternCollection = window.gtd.Pattern.PatternCollection.extend({
			initialize: function() {},
			_matchToAction: function(match) { return 'lllabel'; }
		});
		
		var collection = new PatternCollection();
		var action = new Backbone.Model();
		collection._applyPattern(new Backbone.Model({'type' : collection.TYPE_ACTION, 'data' : [''] }), null, action);
		assertEquals('lllabel', action.get('label'));
	},
	
	testApplyPattern4: function() {
		var PatternCollection = window.gtd.Pattern.PatternCollection.extend({
			initialize: function() {},
			_matchToContext: function(match) { return 'Balck'; }
		});
		
		var collection = new PatternCollection();
		var action = new Backbone.Model();
		collection._applyPattern(new Backbone.Model({'type' : collection.TYPE_CONTEXT, 'data' : [''] }), null, action);
		assertEquals('Balck', action.get('context'));
	},
	end: {}
	
});