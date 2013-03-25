"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	MIN_TAGS_LENGTH: 1,
	RANK_EQUALS: 1.0,
	RANK_MATCHED: 0.7,
	defaults : {
		context: null,
		termextraction: null,
		suggestions: null,
		actions: null,
		strikeamatch: null,
		tagfilter: null
	},
	
	initialize: function(attributes, options) {
		this.get('context').on('suggestion:apply', this._applySuggestion, this);
		this.get('actions').on('search:result', this._searchResult, this);
		this.get('context').on('patterns:fill', this._onActionFill, this);

	},
	
	analyse: function(entry) {
		
		var extparser = this.get('context').get('extparser');
		if (extparser.test(entry.get('title'))) {
			extparser.parse(entry);
			return;
		}
		var text = entry.get('title') + "\n" + entry.get('summary');
		var tags = this.get('termextraction').extract(text);
		tags = this.get('tagfilter').filter(tags);
		
		if (tags.length > this.MIN_TAGS_LENGTH) {
			this.get('actions').search(entry,tags);
		}
	},
	
	_searchResult: function(similarList, entry, tags) {
		var similarAction = null;
		// store as suggestion
		if (similarList.length > 0) {
			similarAction = this._maxSimilarity(similarList, tags);
		}

		if (similarAction === null) {
			this.get('context').get('logger').info(
				'Analysis.NewEmail: Store suggestion ['+tags.join(',')+']'
			);
			var action = this.get('actions').createAction(entry, tags);
			this.get('patterns').fillAction(entry, action);
		} else {
			this.get('context').get('logger').info(
				'gtd.Analysis.NewEmail: Found similar ['+tags.join(',')+'] to ['+similarAction.get('tags').join(',')+']'
			);
//			this.get('patterns').fillAction(entry, similarAction);
			this._applyAction(entry.get('msgid'), similarAction);
		}
	},
	
	_onActionFill: function(entry, action) {
		var suggestion = this.get('suggestions').createSuggestion(entry, action);
		this.get('suggestions').add(suggestion);
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
			if (rank == this.RANK_EUQALS) { //Equals
				similarAction = action;
				similarityRank = rank;
				return true;
			} else if (rank >similarityRank) {
				similarAction = action;
				similarityRank = rank;
			}
			return false;
		}, this);
		if (similarityRank < this.RANK_MATCHED) {
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
		this._applyAction(suggestion.get('id'),action);
	}
});
