"use strict";
/*global assertNull: true, assertEquals: true */
new TestCase("Analysis.StrikeAMatch", {
	strikeamatch: null,

	setUp: function() {
		this.strikeamatch = new window.gtd.Analysis.StrikeAMatch();
	},
	
	testEquals1:function(){
		var actual = this.strikeamatch.compare([ 'tag1', 'tag2', 'tag3'], [ 'tag1', 'tag2', 'tag3' ]);
		assertEquals("Match by equals", 1.0, actual);
	},
	
	testEquals2: function() {
		var actual1 = this.strikeamatch.compare([ 'tag2', 'tag3', 'tag1'], [ 'tag3', 'tag1', 'tag2' ]);
		assertEquals("Match by equals", 1.0, actual1);
	},
	
	testNotEquals: function() {
		var actual = this.strikeamatch.compare([ 'tag1', 'tag2', 'tag3'], [ 'tag5', 'tag6', 'tag7' ]);
		assertEquals("Match by equals", 0.0, actual);
	},
	
	testHalf: function() {
		var actual = this.strikeamatch.compare([ 'tag1', 'tag2', 'tag3', 'tag4'], [ 'tag2', 'tag4', 'tag7', 'tag9' ]);
		assertEquals("Match by equals", 0.5, actual);
	},
	
	testReal: function() {
		var tags = ['alex','amazon','app','app','remov','request','thank','write'];
		var atags = ['84156061','alex','amazon','app','app','case','contact','distribut','gavrishev','m2cmfdkpef4kqp','portal','remov','request','request_app_withdraw','thank','write'];
		var actual = this.strikeamatch.compare(tags, atags);
		console.log(actual);
	}
});