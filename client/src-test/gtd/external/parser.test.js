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
		assertTrue("Match incoming message", this.parser.test(' #gtd #mailid 9'));
		assertFalse("Do not match incoming message", this.parser.test(' alex '));
	},
	
	testParse1 :function() {
		
		var src1 = " #mailid 9 \n#label 2 #deadline 2013-02-28 18:24";		
		var expected1 = {
			'#mailid' : '9',
			'#label' : '2',
			'#deadline' : '2013-02-28'
		};
		
		var actual1 = this.parser._parse(src1);
		assertEquals('Parse result 1', actual1, expected1);
	},
	
	testParse2: function() {
		var src2 = "#deadline 2013-02-28 18:24 #mailid 9 #label 2";		
		var expected2 = {
			'#mailid' : '9',
			'#label' : '2',
			'#deadline' : '2013-02-28'
		};
		
		var actual2 = this.parser._parse(src2);
		assertEquals('Parse result 2', actual2, expected2);
	},
	
	testParse3: function() {
		var src3 = "#mailid 9\n#label 2";		
		var expected3 = {
			'#mailid' : '9',
			'#label' : '2'
		};
		
		var actual3 = this.parser._parse(src3);
		assertEquals('Parse result 3', actual3, expected3);
	},
	
	testParse4:function() {
		var src4 = "#gtd #mailid 199 #label 2 #deadline 2013-02-28 18:24";
		var expected4 = {
			'#gtd' : null,
			'#mailid' : '199',
			'#label' : '2',
			'#deadline' : '2013-02-28'
		};
			
		var actual4 = this.parser._parse(src4);
		assertEquals('Parse result 4', actual4, expected4);
	},
	
	testParse5: function() {
		var src4 = "#gtd #mailid 199 #project Have A Nice Day!! #context In context we trust";
		var expected4 = {
			'#gtd' : null,
			'#mailid' : '199',
			'#project' : 'Have A Nice Day!!',
			'#context' : 'In context we trust'
		};
			
		var actual4 = this.parser._parse(src4);
		assertEquals('Parse result 5', expected4, actual4);
	},
	
	testCreateAction: function() {
		var data = {
			'#label' : 4,
			'#project' : 'Budubabu',
			'#context' : 'In context we trust',
			'#deadline': '2016-08-29'
		};
		var actual = this.parser._createAction(data);
		var expected = {
			label: window.gtd.Label.SOMEDAY,
			project : 'Budubabu',
			context : 'In context we trust',
			date: '2016-08-29'
		};
		
		assertEquals(expected, actual);
		
	}
});