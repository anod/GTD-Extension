"use strict";

window.gtd.Gmail.Imap = Backbone.Model.extend({
	ACTION_LABEL: 1,
	ACTION_CONTENT: 2,
	
	url : 'http://gtd.anodsplace.info/handler.php',
	defaults : {
		$ : window.$,
		context: null,
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
	
	getContent: function(emailId, callback) {
		this._sendRequest({ 
			'action': this.ACTION_CONTENT,
			'msgid' : emailId
		}, function(response) {
			console.log("gtd.Gmail.Imap: getContent finished for email #"+emailId);
			callback(response);
		});
	},
	
	archive: function(emailId) {
		//TODO
	},
	
	_sendRequest: function(params, callback) {
		var data = params || {};
		data['email'] = this.get('context').get('userinfo').get('email');
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