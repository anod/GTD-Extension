"use strict";

window.gtd.Analysis.NewEmail = Backbone.Model.extend({
	MIN_TAGS_LENGTH: 1,
	RANK_EQUALS: 1.0,
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
		this.get('replyemail').on('check:finish', this._onReplyCheckFinish, this);
	},
	
	analyse: function(entry) {
		var subject = entry.get('title');
		
		// Check for notification from External API
		var extparser = this.get('context').get('extparser');
		if (extparser.test(subject)) {
			var suggestion = extparser.parse(entry);
			if (suggestion) {
				this._applySuggestion(suggestion, true);
				this.get('context').get('imap').removeMessage(entry.get('msgid'));
			}
			return;
		}
		
		// Check for Instant Action
		var instantparser = this.get('context').get('instantparser');
		if (instantparser.test(subject)) {
			var instantSuggestion = instantparser.parse(entry);
			if (instantSuggestion) {
				this._applySuggestion(instantSuggestion);
				this.get('context').get('imap').removeMessage(entry.get('msgid'));
			}
			return;
		}
		
		var text = subject + "\n" + entry.get('summary');
		var tags = this._createTags(text);
		
		if (tags.length > this.MIN_TAGS_LENGTH) {
			this.get('replyemail').check(entry, tags);
		}
	},
	
	_createTags: function(text) {
		var tags = this.get('termextraction').extract(text);
		return this.get('tagfilter').filter(tags);
	},
	
	_onReplyCheckFinish: function(entry, tags, applied) {
		if (applied) {
			return;
		}
		this.get('actions').search(entry,tags);
	},
	
	_searchResult: function(similarList, entry, tags) {
		console.log('Analysis.NewEmail: Search result', similarList);
		var similarAction = null;
		// store as suggestion
		if (similarList.length > 0 && this.get('context').get('settings').get('autoActions')) {
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
		this.get('suggestions').insertDb(suggestion);
	},
	
	_maxSimilarity: function(similarList, tags) {
		var similarAction = null;
		var similarityRank = 0;
		
		var rankMatched = this.get('context').get('settings').get('actionTreshold') / 100;
		
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
		if (similarityRank < rankMatched) {
			return null;
		}
		if (similarAction === null) {
			return null;
		}
		return new window.gtd.Analysis.Action(similarAction);
	},
	
	_applyAction: function(mailId, action, silent) {
		this.get('context').trigger('analysis:apply:action', mailId, action, silent);
	},
		
	_applySuggestion: function(suggestion, silent)  {
		//Save as action
		var action = suggestion.get('action');
		this._applyAction(suggestion.get('id'), action, silent);
		//Store action only in case we have tags (Came from suggestion)
		if (action.get('tags')) {
			this.get('actions').insertDb(action);
		}
	}
});
