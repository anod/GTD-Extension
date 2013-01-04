"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	defaults : {
		context: null,
		termextraction: null,
		suggestions: null,
		actions: null,
		topia: null
	},
	
	initialize: function(attributes, options) {
		this.get('context').on('suggestion:apply:label', this._applySuggestion, this);
		this.get('actions').on('search:result', this._searchResult, this);
	},
	
	analyse: function(entry) {
		
		var text = entry.get('title') + "\n" + entry.get('summary');
		var tags2 = this.get('termextraction').extract(text);

		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TEXT] ' + text);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [ TAGS] ' + tags2);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: -------');
		
		if (tags2.length > 0) {
			this.get('actions').search(entry,tags2);
		}
	},
	
	_searchResult: function(similarList, entry, tags) {
		var similarAction = null;
		// store as suggestion
		if (similarList.length > 0) {
			similarAction = this._maxSimilarity(similarList, tags);
		}

		if (similarAction == null) {
			var action = this.get('actions').createAction(entry, tags);
			var suggestion = this.get('suggestions').createSuggestion(entry, action);
			this.get('suggestions').add(suggestion);		
		} else {
			this.get('context').get('logger').info('gtd.Analysis.NewEmail: Found similar ['+tags.join(',')+'] to ['+similarAction.get('tags').join(',')+']' );
			this._applyAction(entry.get('id'), similarAction);
		}
	},
	
	_maxSimilarity: function(similar, tags) {
		var similarAction = null;
		var count = 0;tags.length;
		_.each(similar, function(action) {
			var res = _.intersection(tags, action.tags);
			if (res.length > count) {
				count = res.length;
				similarAction = action;
			}
		});
		if (similarAction == null) {
			return null;
		}
		return new window.gtd.Analysis.Action(similarAction);
	},
	
	_applyAction: function(mailId, action) {
		this.get('context').trigger('analysis:apply:label', mailId, action.get('label'));
	},
		
	_applySuggestion: function(suggestion)  {
		//Save as action
		var action = suggestion.get('action');
		this.get('actions').add(action);
		this._applyAction(suggestion.get('emailId'),action);
	}
});