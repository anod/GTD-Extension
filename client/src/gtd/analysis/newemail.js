"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	defaults : {
		context: null,
		similarsearch : null,
		termextraction: null
	},
	
	analyse: function(entry) {
		
		var titleTags = this.get('termextraction').extract(entry.get('title'));
		var summaryTags = this.get('termextraction').extract(entry.get('summary'));
		
		this.get('context').get('logger').info('gtd.Analysis.NewEmail:' + entry.get('title') + ' : ' + titleTags);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail:' + entry.get('summary') + ' : ' + summaryTags);
		
		var similar = this.get('similarsearch').search(entry);
		
		if (similar.length === 0) {
			// store as suggestion
			// TODO
			//var suggestion = new window.gtd.Suggestion.Suggestion();
			//suggestion.store();
			//this.trigger('analysis:suggestion:new', suggestion);
			return;
		}
		

		
		//TODO run email analyse
		if (entry.get('title').search('GTD-Test') != -1 ||
			entry.get('summary').search('GTD-Test') != -1) {
			this.trigger('analysis:apply:label', 'GTD-Test', entry);
		}
	},
	
	_maxSimilarity: function(similar) {
		_.each(similar, function(action) {
			
		});
	}
	
});