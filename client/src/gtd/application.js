"use strict";

window.gtd.Application = Backbone.Model.extend({
	PULL_TIME: 0.5,
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
		this.context.on("analysis:apply:action", this._applyLabel, this);

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
	
	_applyLabel: function(emailId, action) {
		this.get('imap').applyLabel(emailId, action.get('label'), action.get('archive'));
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