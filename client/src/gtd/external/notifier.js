"use strict";

window.gtd.External.Notifier = Backbone.Model.extend({
	defaults : {
		'context' : null
	},
	
	initialize: function() {
		
	},

	_notifyAction: function() {
		
	},
	
	_createResp: function(uid, email, action) {
		var params = {
			'user_id' : uid,
			'sender_address' : 'sender',
			'mail_id' : '',
			'subject' : '',
			'mail_body' : '',
			'label' : ''
		};
		
		//in reply to
		//project
		//context
		//priority
		//deadline
		//start_date

	}

});