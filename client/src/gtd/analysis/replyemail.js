"use strict";
/**
 * Class to check entry is reply to previously applied action
 * @author alex
 */
window.gtd.Analysis.ReplyEmail = Backbone.Model.extend({
	_labelsMap: null,
	defaults : {
		context: null
	},
	
	/**
	 * @override
	 */
	initialize: function() {
		this._labelsMap = _.invert(window.gtd.Label);
	},
	
	/**
	 * Check if entry is a reply
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 * @event check:finish
	 */
	check: function(entry, tags) {
		var msgid = entry.get('msgid');
		this.get('context').get('imap').getThreadLabels(msgid, _.bind(function(data) {
			var applied = false;
			if (data && data['labels']) {
				var action = this._createAction(data['labels'], entry, tags);
				if (action) {
					this._applyAction(msgid, action);
					applied = true;
				}
			}
			this.trigger('check:finish', entry, tags, applied);
		},this));
	},
	
	/**
	 * Create action based on received list of labels
	 * @access pricate
	 * @param {Array} labels
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 * @returns {window.gtd.Analysis.Action}
	 */
	_createAction: function(labels, entry, tags) {
		if (labels.length === 0) {
			return null;
		}
		var action = this.get('actions').createAction(entry, tags);
		_.each(labels, function(label) {
			if (this._labelsMap[label]) {
				action.set('label', label);
			} else if (label.indexOf('GTD/P-') === 0) {
				action.set('project', label.replace('GTD/P-', ''));
			} else if (label.indexOf('GTD/D-') === 0) {
				action.set('date', label.replace('GTD/D-', ''));
			} else if (label.indexOf('GTD/C-') === 0) {
				action.set('context', label.replace('GTD/C-', ''));
			} 
		}, this);
		return action;
	},
	
	/**
	 * Trigger apply action
	 * @access private
	 * @param {String} emailId
	 * @param {window.gtd.Analysis.Action} action
	 */
	_applyAction: function(emailId, action) {
		this.get('context').trigger('analysis:apply:action', emailId, action);
	}
	
});