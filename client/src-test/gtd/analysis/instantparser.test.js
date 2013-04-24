"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Analysis.InstantParser", {
	context: null,
	parser: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		this.parser = new window.gtd.Analysis.InstantParser({ 'context' : this.context });
	},
	
	testTest:function(){
		assertTrue("Match incoming message", this.parser.test(' #gtd '));
		assertFalse("Do not match incoming message", this.parser.test(' alex '));
	},
	
	testParse:function() {
		
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
	
		var src2 = "Beer #gtd #project Home stuff";		
		var expected2 = {
			'#gtd' : null,
			'#label' : window.gtd.Label.PROJECT,
			'#project' : 'Home stuff',
			'#text' : 'Beer'
		};
		
		var actual2 = this.parser._parse(src2);
		assertEquals('Parse result 2', expected2, actual2);
	}
});