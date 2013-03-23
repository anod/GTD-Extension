"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Pattern.PatternCollection", {
	context: null,
	patterns: null,
	newemail: null,
	strikeamatch: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console,
			'settings' : new Backbone.Model({ 'firstTime' : false })
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
	
	test_testPatternDate1: function() {
		this._testPatternDate('Buy milk this weekend', 'this weekend');
		this._testPatternDate('Buy milk tomorrow', 'tomorrow');
		this._testPatternDate('Buy milk this or next  weekend', 'next  weekend');
		this._testPatternDate('Buy milk today', 'today');
		this._testPatternDate('Call Peter at 7pm', '7pm' );
		this._testPatternDate('Call Peter today at 7pm', 'today' );
		this._testPatternDate('no date related stuff here', null );
		this._testPatternDate('Order pizza next week', 'next week' );
		this._testPatternDate('Fly to Barcelona next month with family', 'next month' );
		this._testPatternDate('Finish project until 1/5', '1/5' );
		this._testPatternDate('Save day at 20/07', '20/07' );
		this._testPatternDate('Cancel subscription at 1-7-2013', '1-7-2013' );
		this._testPatternDate('Cancel subscription at 08-11-2013', '08-11-2013' );
	}
});