"use strict";

window.gtd.External.Api = {
		
	Consts : {
		NEXT_ACTION_LABEL_ID: 1,
		WATING_ON_LABEL_ID: 2,
		DELAYED_LABEL_ID: 3,
		SOMEDAY_LABEL_ID: 4,
		PROJECT_LABEL_ID: 5,
		
		NO_PRIORITY: 0,
		HIGH_PRIORITY: 1,
		MEDIUM_PRIORITY: 2,
		LOW_PRIORITY: 3
	},
	
	createResp: function(uid, email, action) {
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

};