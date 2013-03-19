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
	
	applyLabel: function(emailId, label, archive) {
		this._sendRequest({ 
			'action': this.ACTION_LABEL,
			'msgid' : emailId,
			'label' : label,
			'archive' : (archive) ? 1 : 0
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

		this.get('$').post(this.url, data, function(response){
			var obj = (response) ? JSON.parse(response) : null;
			if (!obj || obj.status == 'error') {
				console.error(response);
			} else {
				callback(obj);
			}
		});
	}
});