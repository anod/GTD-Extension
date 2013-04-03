"use strict";

window.gtd.Analysis.ReplyEmail = Backbone.Model.extend({
	_labelsMap: null,
	defaults : {
		context: null
	},
	
	initialize: function() {
		this._labelsMap = _.invert(window.gtd.Label);
	},
	
	check: function(entry, tags) {
		var msgid = entry.get('msgid');
		this.get('context').get('imap').getThreadLabels(msgid, _.bind(function(data) {
			var applied = false;
			if (data && data['labels']) {
				var action = this._createAction(data['labels']);
				if (action) {
					this._applyAction(msgid, action);
					applied = true;
				}
			}
			this.trigger('check:finish', entry, tags, applied);
		},this));
	},
	
	_createAction: function(labels, entry, tags) {
		if (labels.length === 0) {
			return null;
		}
		var action = this.get('actions').createAction(entry, tags);
		for(var label in labels) {
			if (this._labelsMap[label]) {
				action.set('label', label);
			} else if (label.indexOf('GTD%2FP-') === 0) {
				action.set('project', label.replace('GTD%2FP-', ''));
			} else if (label.indexOf('GTD%2FD-') === 0) {
				action.set('date', label.replace('GTD%2FD-', ''));
			} else if (label.indexOf('GTD%2FP-') === 0) {
				action.set('context', label.replace('GTD%2FC-', ''));
			} 
		}
		return action;
	},
	
	_applyAction: function(emailId, action) {
		this.get('context').trigger('analysis:apply:action', emailId, action);
	}
	
});