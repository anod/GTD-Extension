"use strict";

window.gtd.Gmail.Imap = Backbone.Model.extend({
	ACTION_LABEL: 1,
	
	url : 'http://gtd.anodsplace.info/handler.php',
	defaults : {
		$ : window.$,
		notification: window.notification,
		errorHandler : window.errorHandler,
		oauth : null
	},
	
	applyLabel: function(emailId, label) {
		this._sendRequest({ 
			'action': this.ACTION_LABEL,
			'msgid' : emailId,
			'label' : label
		}, function(response) {
			console.log("gtd.Gmail.Imap: Label '"+label+"' applied to email #"+emailId);
		});
	},
	
	fillDetails: function(emailId) {
		//TODO
	},
	
	archive: function(emailId) {
		//TODO
	},
	
	_sendRequest: function(params, callback) {
		var data = params || {};
		data['email'] = 'alex.gavrishev@gmail.com';
		data['token'] = this.get('oauth').getAccessToken();
		var self = this;
		this.get('$').post(this.url, data, function(response){
			if (!response || response.status == 'error') {
				console.error(response.message);
			} else {
				callback(response);
			}
		});
	}
});