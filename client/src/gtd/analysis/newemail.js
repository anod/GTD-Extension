"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	defaults : {
		context: null,
		termextraction: null,
		suggestions: null,
		actions: null,
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
		
		var similar = this.get('actions').search(tags2);

		if (similar.length === 0) {
			var action = new window.gtd.Analysis.Action({
				'author_email' : entry.get('author_email'),
				'author_name' : entry.get('author_name'),
				'tags' : tags2
			});

			// store as suggestion
			var suggestion = new window.gtd.Suggestion.Suggestion({
				'emailId' : entry.get('id'),
				'msgId' : entry.get('msgId'),
				'action': action
			});
			this.get('suggestions').add(suggestion);
			return;
		}

		var similarAction = this._maxSimilarity(similar);
		this._applyAction(entry, similarAction);
	},
	
	_maxSimilarity: function(similar) {
		_.each(similar, function(action) {
			//TODO
			return action;
		});
	},
	
	_applyAction: function(entry, action) {
		this.trigger('analysis:apply:label', 'GTD-Test', entry);
	}
	
});