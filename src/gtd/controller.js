"use strict";

window.gtd.Controller = Backbone.Model.extend({
	defaults : {
		gmail : null,
		chrome : null,
		oauth : null
	},
	
	runBackground: function(oauth) {
		this.get('chrome').browserAction.setBadgeText({ text: '...'});
		this.get('gmail').loadNewEmails();
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		
		this.get('chrome').alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				this.get('gmail').loadNewEmails();
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
		// Create a simple text notification:
		var notification = window.webkitNotifications.createNotification(
			'../graphics/icon_128.png',  // icon url - can be relative
			'New Emails',  // notification title
			text // notification body text
		);
		
		notification.show();
		setTimeout(function(){
			notification.cancel();
		},5000);		
		this.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	}

});