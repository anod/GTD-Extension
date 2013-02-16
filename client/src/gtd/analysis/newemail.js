"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	MIN_TAGS_LENGTH: 3,
	defaults : {
		context: null,
		termextraction: null,
		suggestions: null,
		actions: null,
		strikeamatch: null
	},
	
	initialize: function(attributes, options) {
		this.get('context').on('suggestion:apply', this._applySuggestion, this);
		this.get('actions').on('search:result', this._searchResult, this);
	},
	
	analyse: function(entry) {
		
		var text = entry.get('title') + "\n" + entry.get('summary');
		var tags2 = this.get('termextraction').extract(text);

		//this.get('context').get('logger').info('gtd.Analysis.NewEmail: [TEXT] ' + text);
		//this.get('context').get('logger').info('gtd.Analysis.NewEmail: [ TAGS] ' + tags2);
		//this.get('context').get('logger').info('gtd.Analysis.NewEmail: -------');
		
		if (tags2.length > this.MIN_TAGS_LENGTH) {
			this.get('actions').search(entry,tags2);
		}
	},
	
	_searchResult: function(similarList, entry, tags) {
		var similarAction = null;
		// store as suggestion
		if (similarList.length > 0) {
			similarAction = this._maxSimilarity(similarList, tags);
		}

		if (similarAction === null) {
			this.get('context').get('logger').info('Analysis.NewEmail: Store suggestion ['+tags.join(',')+']' );
			var action = this.get('actions').createAction(entry, tags);
			var suggestion = this.get('suggestions').createSuggestion(entry, action);
			this.get('suggestions').add(suggestion);
		} else {
			this.get('context').get('logger').info('gtd.Analysis.NewEmail: Found similar ['+tags.join(',')+'] to ['+similarAction.get('tags').join(',')+']' );
			this._applyAction(entry.get('id'), similarAction);
		}
	},
	
	_maxSimilarity: function(similarList, tags) {
		var similarAction = null;
		var similarityRank = 0;
		
		this.get('context').get('logger').info('gtd.Analysis.NewEmail: _maxSimilarity, tags: [' + tags.join(',') + ']');
		_.find(similarList, function(action) {
			var rank = this.get('strikeamatch').compare(tags, action.tags);
			this.get('context').get('logger').info(
				'gtd.Analysis.NewEmail: ' +
				'Similarity = ' + rank +
				', action.tags: [' + action.tags.join(',') + '] '
			);
			if (rank == 1.0) { //Equals
				similarAction = action;
				similarityRank = rank;
				return true;
			} else if (rank >similarityRank) {
				similarAction = action;
				similarityRank = rank;
			}
			return false;
		}, this);
		if (similarityRank < 0.7) {
			return null;
		}
		if (similarAction === null) {
			return null;
		}
		return new window.gtd.Analysis.Action(similarAction);
	},
	
	_applyAction: function(mailId, action) {
		this.get('context').trigger('analysis:apply:action', mailId, action);
	},
		
	_applySuggestion: function(suggestion)  {
		//Save as action
		var action = suggestion.get('action');
		this.get('actions').add(action);
		this._applyAction(suggestion.get('emailId'),action);
	}
});
