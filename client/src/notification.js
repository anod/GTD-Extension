"use strict";
/**
 * Show notification window
 */
window.notification = {
	
	notify: function(title, msg) {
		// Create a simple text notification:
		var notification = window.webkitNotifications.createNotification(
			'../graphics/icon_128.png',  // icon url - can be relative
			title,  // notification title
			msg // notification body text
		);
		
		notification.show();
		window.setTimeout(function(){
			notification.cancel();
		},5000);		

	},
		
	error: function(msg) {
		console.log('Error: '+msg);
		this.notify('Error', msg);
	}
	
};