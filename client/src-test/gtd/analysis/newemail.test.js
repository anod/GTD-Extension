"use strict";
/*global assertNull: true, assertEquals: true */
new TestCase("Analysis.NewEmailTest", {
	context: null,
	actions: null,
	newemail: null,
	setUp: function() {
		this.context = new window.gtd.Context();
		this.actions = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });
		this.newemail = new window.gtd.Analysis.NewEmail({
			'context' : this.context,
			'actions' : this.actions
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
	}
	
});