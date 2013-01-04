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
		var tags1 = this.get('topia').call(text);
		var tags2 = this.get('termextraction').extract(text);

		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TEXT ] ' + text);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TOPIA] ' + tags1);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: [CUSTO] ' + tags2);
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: -------');
		
		if (tags2.length > 0) {
			this.get('actions').search(entry,tags2);
		}
	},
	
	_searchResult: function(similarList, entry, tags) {
		// store as suggestion
		if (similarList.length === 0) {
			var action = this.get('actions').createAction(entry, tags);
			var suggestion = this.get('suggestions').createSuggestion(entry, action);
			this.get('suggestions').add(suggestion);
			return;
		}

		var similarAction = this._maxSimilarity(similarList);
		this._applyAction(entry.get('id'), similarAction);
	},
	
	_maxSimilarity: function(similar) {
		var similarAction = null;
		_.find(similar, function(action) {
			//TODO
			similarAction = action;
			return true;
		});
		return similarAction;
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