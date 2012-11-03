"use strict";

window.gtd.Controller = Backbone.Model.extend({
	defaults : {
		notification: window.notification,
		gmail : null,
		chrome : null,
		oauth : null
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
		collection.forEach(function(entry) {
			text += entry.get('title');
			text += "\n";
		});
		this.get('notification').notify('New Emails', text);
		this.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	}

});