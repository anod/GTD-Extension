"use strict";
/**
 * Class for communication with Gmail IMAP API
 * @author alex
 */
window.gtd.Gmail.Imap = Backbone.Model.extend({
	ACTION_LABEL: 1,
	ACTION_CONTENT: 2,
	ACTION_THREAD_LABELS: 3,
	ACTION_REMOVE: 4,
	
	url : 'http://gtd.anodsplace.info/handler.php',
	defaults : {
		$ : window.$,
		context: null,
		oauth : null
	},
	
	/**
	 * Apply labels to an email
	 * @param {String} emailId
	 * @param {Array} labels
	 * @param {Boolean} archive
	 */
	applyLabels: function(emailId, labels, archive) {
		this._sendRequest({ 
			'action': this.ACTION_LABEL,
			'msgid' : emailId,
			'labels' : labels,
			'archive' : (archive) ? 1 : 0
		}, function(response) {
			console.log("gtd.Gmail.Imap: Labels ["+labels.join(',')+"] applied to email #"+emailId);
		});
	},
	
	/**
	 * Get content of the emails
	 * @param {String} emailId
	 * @param {Function} callback
	 */
	getContent: function(emailId, callback) {
		this._sendRequest({ 
			'action': this.ACTION_CONTENT,
			'msgid' : emailId
		}, function(response) {
			console.log("gtd.Gmail.Imap: getContent finished for email #"+emailId);
			callback(response);
		});
	},

	/**
	 * Get GTD labels attached to the email
	 * @param {String} emailId
	 * @param {Function} callback
	 */
	getThreadLabels: function(emailId, callback) {
		this._sendRequest({ 
			'action': this.ACTION_THREAD_LABELS,
			'msgid' : emailId
		}, function(response) {
			console.log("gtd.Gmail.Imap: getThreadLabels finished for email #"+emailId);
			callback(response);
		});
	},
	
	/**
	 * Move email to Trash
	 * @param {String} emailId
	 */
	removeMessage: function(emailId) {
		this._sendRequest({ 
			'action': this.ACTION_REMOVE,
			'msgid' : emailId
		}, function(response) {
			console.log("gtd.Gmail.Imap: removeMessage #"+emailId);
		});
	},
	
	/**
	 * Send authorized request to the server using POST
	 * @access private
	 * @param {Object} params
	 * @param {Function} callback
	 */
	_sendRequest: function(params, callback) {
		var data = params || {};
		this.get('oauth').authorize(_.bind(function() {
			data['email'] = this.get('context').get('userinfo').get('email');
			data['token'] = this.get('oauth').getAccessToken();
			this.get('$').post(this.url, data, function(response){
				var obj = (response) ? JSON.parse(response) : null;
				if (!obj || obj.status == 'error') {
					console.error(response);
					callback(null);
				} else {
					callback(obj);
				}
			});
		}, this));


	}
});