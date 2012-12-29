"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	defaults : {
		context: null,
		similarsearch : null,
		termextraction: null,
		topia: null
	},
	
	analyse: function(entry) {
		
		var text = entry.get('title') + "\n" + entry.get('summary');
		var tags1 = this.get('topia').call(text);
		var tags2 = this.get('termextraction').extract(text);

		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TEXT ] ' + text);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TOPIA] ' + tags1);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [CUSTO] ' + tags2);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: -------');
		
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