"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("External.Parser", {
	context: null,
	parser: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		this.parser = new window.gtd.External.Parser({ 'context' : this.context });
	},
	
	testTest:function(){
		assertTrue("Match incoming message", this.parser.test(' #gtd '));
		assertFalse("Do not match incoming message", this.parser.test(' alex '));
	},
	
	testParse:function() {
		
		var src1 = " #mailid 9 \n#label 2 #deadline 2013-02-28 18:24";		
		var expected1 = {
			'#mailid' : '9',
			'#label' : '2',
			'#deadline' : '2013-02-28 18:24'
		};
		
		var actual1 = this.parser._parse(src1);
		assertEquals('Parse result 1', actual1, expected1);
		
		var src2 = "#deadline 2013-02-28 18:24 #mailid 9 #label 2";		
		var expected2 = {
			'#mailid' : '9',
			'#label' : '2',
			'#deadline' : '2013-02-28 18:24'
		};
		
		var actual2 = this.parser._parse(src2);
		assertEquals('Parse result 2', actual2, expected2);
		
		var src3 = "#mailid 9\n#label 2";		
		var expected3 = {
			'#mailid' : '9',
			'#label' : '2'
		};
		
		var actual3 = this.parser._parse(src3);
		assertEquals('Parse result 3', actual3, expected3);
		
		var src4 = "#gtd #mailid 199 #label 2 #deadline 2013-02-28 18:24";
		var expected4 = {
			'#gtd' : null,
			'#mailid' : '199',
			'#label' : '2',
			'#deadline' : '2013-02-28 18:24'
		};
			
		var actual4 = this.parser._parse(src4);
		assertEquals('Parse result 4', actual4, expected4);
	}
});