"use strict";

window.gtd.Application = Backbone.Model.extend({
	PULL_TIME: 1.0,
	context: null,
	defaults : {
		context: null,
		gmail : null,
		newemail: null,
		imap : null
	},

	initialize: function(attributes) {
		this.context = attributes.context;
		this.context.get('chrome').extension.onMessage.addListener(_.bind(this._message, this));
		this.get('router').on('suggestion:show', this._onSuggestionShow, this);
	},
	
	runBackground: function(oauth) {
		this.context.get('chrome').browserAction.setBadgeText({ text: '...'});
		
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		this.get('gmail').loadNewEmails();
		this.context.on("analysis:apply:action", this._applyLabels, this);

		this._registerPullAlarm();
	},

	_registerPullAlarm: function() {
		this.context.get('chrome').alarms.onAlarm.addListener(_.bind(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				if (!this._checkConnection()) {
					console.log('offline');
					return;
				}
				this.get('gmail').loadNewEmails();
			}
		},this));
		
		this.context.get('chrome').alarms.create('loadNewEmails', {periodInMinutes : this.PULL_TIME});
	},
	
	_checkConnection: function() {
		return window.navigator.onLine;
	},
	
	_applyLabels: function(emailId, action) {
		var labels = [];
		labels.push(action.get('label'));
		if (action.get('project')) {
			labels.push('GTD%2FP-'+action.get('project'));
		}
		if (action.get('date')) {
			labels.push('GTD%2FD-'+action.get('date'));
		}
		if (action.get('context')) {
			labels.push('GTD%2FC-'+action.get('context'));
		}
		
		this.get('imap').applyLabels(emailId, labels, action.get('archive'));
	},
	
	_notifyList: function(collection) {
		var newmail = this.get('newemail');
		collection.each(function(entry) {
			newmail.analyse(entry);
		});
		this.context.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	},

	_message: function(message, sender) {
		console.log("[Extension] Received:", message, (this.app)? true : false);
		this.get('router').route(message, { tabId : sender.tab.id});
	},

	_onSuggestionShow: function(suggestion, options) {
		var message = {
			'action' : 'show',
			'suggestion' : suggestion
		};
		console.log("[Extension] Send:", message, options);
		this.context.get('chrome').tabs.sendMessage(options.tabId, message);
	}

});