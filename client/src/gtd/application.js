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
	},
	
	runBackground: function(oauth) {
		this.context.get('chrome').browserAction.setBadgeText({ text: '...'});
		this.get('gmail').loadNewEmails();
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		this.get('newemail').on("analysis:apply:label", this._applyLabel, this);

		var self = this;
		this.context.get('chrome').alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				self.get('gmail').loadNewEmails();
			}
		});
		
		this.context.get('chrome').alarms.create('loadNewEmails', {periodInMinutes : this.PULL_TIME});
	},
	
	_notifyList: function(collection) {
		var text = '';
		var self = this;
		collection.forEach(function(entry) {
			text += entry.get('title');
			text += "\n";
			self.get('newemail').analyse(entry);
		});
		this.context.get('notification').notify('New Emails', text);
		this.context.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	},
	
	_applyLabel: function(label, entry) {
		this.get('imap').applyLabel(entry.get('id'), label);
	}

});