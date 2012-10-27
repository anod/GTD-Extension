gtd.Controller = Backbone.Model.extend({
	defaults : {
		gmail : null,
		chrome : null,
		oauth : null
	},
	
	runBackground: function(oauth) {
		this.get('gmail').loadNewEmails();
		this.get('gmail').on("gmail:newlist", function(collection) {
			console.log(collection.toJSON());
		});
	}


});