gtd.Controller = Backbone.Model.extend({
	defaults : {
		gmail : null,
		chrome : null,
		oauth : null
	},
	
	runBackground: function(oauth) {
		chrome.browserAction.setBadgeText({ text: '...'});
		this.get('gmail').loadNewEmails();
		this.get('gmail').on("gmail:newlist", function(collection) {
			var text = '';
			collection.forEach(function(entry) {
				text += entry.get('title');
				text += "\n";
			});
			// Create a simple text notification:
			var notification = webkitNotifications.createNotification(
			  'graphics/icon_128.png',  // icon url - can be relative
			  'New Emails',  // notification title
			  text // notification body text
			);
			
			notification.show();
			chrome.browserAction.setBadgeText({ text: collection.length + ''});
		});
	}


});