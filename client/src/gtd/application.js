"use strict";

window.gtd.Application = Backbone.Model.extend({
	PULL_TIME: 2,
	context: null,
	defaults : {
		context: null,
		gmail : null,
		newemail: null,
		imap : null
	},

	initialize: function(attributes) {
		this.context = attributes.context;
		this.context.get('chrome').extension.onMessage.addListener(this._message);
		this.get('router').on('suggestion:show', this._onSuggestionShow);
	},
	
	runBackground: function(oauth) {
		this.context.get('chrome').browserAction.setBadgeText({ text: '...'});
		
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		this.get('gmail').loadNewEmails();
		this.context.on("analysis:apply:label", this._applyLabel, this);

		
		
		var self = this;
		this.context.get('chrome').alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				self.get('gmail').loadNewEmails();
			}
		});
		
		this.context.get('chrome').alarms.create('loadNewEmails', {periodInMinutes : this.PULL_TIME});
	},
	
	_applyLabel: function(emailId, label) {
		this.get('imap').applyLabel(emailId, label);
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
		if (this.app) {
			this.get('router').route(message, { tabId : sender.tab.id});
		}
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