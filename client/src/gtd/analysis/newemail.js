"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	defaults : {
		settings: null,
		similarsearch : null
	},
	
	analyse: function(entry) {
		
		var similar = this.get('similarsearch').search(entry);
		
		if (similar.length === 0) {
			// store as suggestion
			// TODO
			//var suggestion = new window.gtd.Suggestion.Suggestion();
			//suggestion.store();
			this.trigger('analysis:suggestion:new', suggestion);
			return;
		}
		

		
		//TODO run email analyse
		if (entry.get('title').search('GTD-Test') != -1 ||
			entry.get('summary').search('GTD-Test') != -1) {
			this.trigger('analysis:apply:label', 'GTD-Test', entry);
		}
	},
	
	_maxSimilarity: function(simliar) {
		_.each(similar, function(action) {
			
		});
	}
	
});