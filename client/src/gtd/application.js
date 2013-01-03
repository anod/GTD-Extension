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
	}

});