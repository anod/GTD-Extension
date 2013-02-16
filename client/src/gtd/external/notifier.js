"use strict";

window.gtd.External.Notifier = Backbone.Model.extend({
	defaults : {
		'$' : window.$,
		'context' : null,
		'imap' : null
	},
	
	initialize: function() {
		this.get('context').on('analysis:apply:action', this._notifyAction, this);
	},

	_notifyAction: function(emailId, action) {
		this.get('imap').getContent(emailId, _.bind(function(data) {
			var params = this._createRequest(emailId, data, action);
			this._sendRequest(params);
		},this));
	},
	
	_createRequest: function(emailId, email, action) {
		var params = {
			'user_id' : this.get('context').get('imap').get('clientId'),
			'sender_address' : email.sender,
			'mail_id' : emailId,
			'subject' : email.subject,
			'mail_body' : email.body,
			'label' : action.get('label'),
			'project': action.get('project'),
			'context': action.get('context'),
			'deadline': action.get('deadline')
		};
		
		//in reply to
		//start_date
		return params;
	},
	
	_sendRequest: function(params, callback) {
		var data = params || {};
		data['email'] = this.get('oauth').get('clientId');
		data['token'] = this.get('oauth').getAccessToken();
		var self = this;
		var url = window.gtd.External.Api.URL;
		this.get('$').post(url, data, function(response){
			if (!response || response.status == 'error') {
				console.error(response.message);
			} else {
				console.log(response);
			}
		});
	}

});