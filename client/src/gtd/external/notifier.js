"use strict";

window.gtd.External.Notifier = Backbone.Model.extend({
	defaults : {
		'$' : window.$,
		'oauth' : window.oauth,
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
			'user_id' : this.get('context').get('userinfo').get('email'),
			'sender_address' : email.from,
			'mail_id' : emailId,
			'subject' : email.subject,
			'mail_body' : email.body,
			'thread_id' : email.thrid,
			'label' : this._labelToId(action.get('label')),
			'project': action.get('project'),
			'context': action.get('context'),
			'deadline': action.get('deadline')
		};
		
		//in reply to
		//start_date
		return params;
	},
	
	_labelToId: function(label) {
		var labels = [ 'GTD-NextAction', 'GTD-WaitingFor', 'GTD-Calendar', 'GTD-Someday', 'GTD-Project' ];
		return labels[label] + 1;
	},
	
	_sendRequest: function(params, callback) {
		var data = params || {};
		var self = this;
		var url = window.gtd.External.Api.URL;
		this.get('$').post(url, data, function(response){
			console.log(response);
		});
	}

});