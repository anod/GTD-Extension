"use strict";

window.gtd.Controller = Backbone.Model.extend({
	defaults : {
		notification: window.notification,
		gmail : null,
		imap : null,
		oauth: window.oauth,
		chrome: window.chrome
	},
	
	runBackground: function(oauth) {
		this.get('chrome').browserAction.setBadgeText({ text: '...'});
		this.get('gmail').loadNewEmails();
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		
		var self = this;
		this.get('chrome').alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				self.get('gmail').loadNewEmails();
			}
		});
		
		this.get('chrome').alarms.create('loadNewEmails', {periodInMinutes : 2});
	},
	
	_notifyList: function(collection) {
		var text = '';
		var self = this;
		collection.forEach(function(entry) {
			text += entry.get('title');
			text += "\n";
			if (entry.get('title').search('GTD-Test') != -1 ||
				entry.get('summary').search('GTD-Test') != -1) {
				self.get('imap').applyLabel(entry.get('id'), 'GTD-Test');
			}
		});
		this.get('notification').notify('New Emails', text);
		this.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	}

});