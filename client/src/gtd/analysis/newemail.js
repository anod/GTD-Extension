"use strict";
/**
 * Class process new emails
 * Flow for check new email:
 *   "Ext API Parser" -> "Instant Action Parser" -> "Stored Suggestion" -> "Reply Email" -> "Action Search" -> "Save Suggestion"
 * @author alex
 */
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
	
	/**
	 * @ovarride
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	initialize: function(attributes, options) {
		this.get('context').on('suggestion:apply', this._applySuggestion, this);
		this.get('actions').on('search:result', this._searchResult, this);
		this.get('context').on('patterns:fill', this._onActionFill, this);
		this.get('replyemail').on('check:finish', this._onReplyCheckFinish, this);
	},
	
	/**
	 * Analyze new email entry
	 * @param {window.gtd.Gmail.Entry} entry
	 */
	analyse: function(entry) {
		var subject = entry.get('title');
		
		// Check for notification from External API
		var extparser = this.get('context').get('extparser');
		if (extparser.test(subject)) {
			this._processExternal(entry);
			return;
		}
		
		// Check for Instant Action
		var instantparser = this.get('context').get('instantparser');
		if (instantparser.test(subject)) {
			this._processInstant(entry);
			return;
		}
		
		// Checks if the email already has been processed and stored in suggestions
		this.get('suggestions').load(entry.get('msgid'), null, _.bind(function(suggestion) {
			if (!suggestion) {
				this._runCheck(subject, entry);
			}
		}, this));
	},
	
	/**
	 * Run check for email content
	 * @access private
	 * @param {String} subject
	 * @param {window.gtd.Gmail.Entry} entry
	 */
	_runCheck: function(subject, entry) {
		var text = subject + "\n" + entry.get('summary');
		var tags = this._createTags(text);
		
		if (tags.length > this.MIN_TAGS_LENGTH) {
			this._checkReplyEmail(entry, tags);
		}
	},
	
	/**
	 * Check if then entry is a reply to previously created action
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 */
	_checkReplyEmail: function(entry, tags) {
		this.get('replyemail').check(entry, tags);
	},
	
	/**
	 * Check and process messages from external API
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 */
	_processExternal: function(entry) {
		var suggestion = this.get('context').get('extparser').parse(entry);
		if (suggestion) {
			this._applySuggestion(suggestion, true);
			this.get('context').get('imap').removeMessage(entry.get('msgid'));
		}
	},
	
	/**
	 * Check and process "Instant Action" messages
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 */
	_processInstant: function(entry) {
		var instantSuggestion = this.get('context').get('instantparser').parse(entry);
		if (instantSuggestion) {
			this._applySuggestion(instantSuggestion);
			this.get('context').get('imap').removeMessage(entry.get('msgid'));
		}
	},
	
	/**
	 * Convert text into tags
	 * @access private
	 * @param {String} text
	 * @returns {Array}
	 */
	_createTags: function(text) {
		var tags = this.get('termextraction').extract(text);
		return this.get('tagfilter').filter(tags);
	},
	
	/**
	 * Called when replay massage check finished
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 * @param {Boolean} applied
	 */
	_onReplyCheckFinish: function(entry, tags, applied) {
		if (applied) {
			return;
		}
		this.get('actions').search(entry,tags);
	},
	
	/**
	 * Called when action search finieshd
	 * @access private
	 * @param {Array} similarList
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 */
	_searchResult: function(similarList, entry, tags) {
		var similarAction = null;
		// store as suggestion
		if (similarList.length > 0 && this.get('context').get('settings').get('autoActions')) {
			similarAction = this._maxSimilarity(similarList, tags);
		}

		if (similarAction === null) {
			this.get('context').get('logger').info(
				'Analysis.NewEmail: Store suggestion ['+tags.join(',')+']'
			);
			this._fillAction(entry, tags);
		} else {
			this.get('context').get('logger').info(
				'gtd.Analysis.NewEmail: Found similar ['+tags.join(',')+'] to ['+similarAction.get('tags').join(',')+']'
			);
			this._applyAction(entry.get('msgid'), similarAction);
		}
	},
	
	/**
	 * Create and fill action with suggestions from email entry
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 */
	_fillAction: function(entry, tags) {
		var action = this.get('actions').createAction(entry, tags);
		this.get('patterns').fillAction(entry, action);
	},
	
	/**
	 * Called when fill action done to save new action in db
	 * @access private
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {window.gtd.Analysis.Action} action
	 */
	_onActionFill: function(entry, action) {
		var suggestion = this.get('suggestions').createSuggestion(entry, action);
		this.get('suggestions').insertDb(suggestion);
	},
	
	/**
	 * Calculates maximum similar action within smilarList
	 * @access private
	 * @param {Array} similarList
	 * @param {Array} tags
	 * @returns {window.gtd.Analysis.Action}
	 */
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
	
	/**
	 * Trigger apply action event
	 * @access private
	 * @param {String} mailId
	 * @param {window.gtd.Analysis.Action} action
	 * @param {Boolean} silent
	 */
	_applyAction: function(mailId, action, silent) {
		this.get('context').trigger('analysis:apply:action', mailId, action, silent);
	},
	
	/**
	 * Apply action from suggestion and store it
	 * @access private
	 * @param suggestion
	 * @param {Boolean} silent
	 */
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
