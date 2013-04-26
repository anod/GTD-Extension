"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Pattern.Pattern", {
	
	testValidate1: function() {
		var pattern = new window.gtd.Pattern.Pattern();
		assertEquals(pattern.errors.TYPE,pattern.validate({ 'type' : null }));
	},
	
	testValidate2: function() {
		var pattern = new window.gtd.Pattern.Pattern();
		assertEquals(pattern.errors.FROM_OR_CONTENT,pattern.validate({'type': 1}));
	},

	testValidate3: function() {
		var pattern = new window.gtd.Pattern.Pattern();
		assertEquals(pattern.errors.VALUE,pattern.validate({'type': 4, 'from': 'regex'}));
	},

	testValidate4: function() {
		var pattern = new window.gtd.Pattern.Pattern();
		assertEquals(pattern.errors.ACTION,pattern.validate({'type': 2}));
	},

	testValidate5: function() {
		var pattern = new window.gtd.Pattern.Pattern();
		assertTrue(!pattern.validate({'type': 3, 'action' : 'aaa'}));
	}
	
});