"use strict";
/**
 * Main Appliaction Controller
 * @author alex
 */
window.gtd.Application = Backbone.Model.extend({
	PULL_TIME: 1.0,
	context: null,
	defaults : {
		context: null,
		gmail : null,
		newemail: null,
		imap : null
	},
	
	/**
	 * @override
	 * @param {Object} attributes
	 */
	initialize: function(attributes) {
		this.context = attributes.context;
		this.context.get('chrome').extension.onMessage.addListener(_.bind(this._message, this));
		this.context.on('message:send', this._sendMessage, this);
	},
	
	/**
	 * Start application
	 * @param oauth
	 */
	runBackground: function(oauth) {
		this.context.get('chrome').browserAction.setBadgeText({ text: '...'});
		
		this.get('gmail').on("gmail:newlist", this._notifyList, this);
		this.get('gmail').loadNewEmails();
		this.context.on("analysis:apply:action", this._applyLabels, this);
		this.context.on('check:newemails', this._checkNewEmails, this);
		
		this._registerPullAlarm();
	},

	/**
	 * Pull infromation about new emails
	 * @access private
	 */
	_registerPullAlarm: function() {
		this.context.get('chrome').alarms.onAlarm.addListener(_.bind(function(alarm) {
			if (alarm.name == "loadNewEmails") {
				this.context.trigger('check:newemails');
			}
		},this));
		
		this.context.get('chrome').alarms.create('loadNewEmails', {periodInMinutes : this.PULL_TIME});
	},
	
	/**
	 * Check new emails, repecting internet connection status
	 * @access private
	 */
	_checkNewEmails: function() {
		if (!this._checkConnection()) {
			console.log('offline');
			return;
		}
		if (!this.context.get('settings').get('enabled')) {
			return;
		}
		this.get('gmail').loadNewEmails();
	},
	
	/**
	 * @access private
	 * @returns {Boolean}
	 */
	_checkConnection: function() {
		return window.navigator.onLine;
	},
	
	/**
	 * Apply labels to an email
	 * @access private
	 * @param {String} emailId
	 * @param {window.gtd.Analysis.Action} action
	 */
	_applyLabels: function(emailId, action) {
		var labels = [];
		labels.push(action.get('label'));
		if (action.get('project')) {
			labels.push('GTD/P-'+action.get('project'));
		}
		if (action.get('date')) {
			labels.push('GTD/D-'+action.get('date'));
		}
		if (action.get('context')) {
			labels.push('GTD/C-'+action.get('context'));
		}
		
		this.get('imap').applyLabels(emailId, labels, action.get('archive'));
	},
	
	/**
	 * Analyse email entries
	 * @access private
	 * @param {Array} collection
	 */
	_notifyList: function(collection) {
		var newmail = this.get('newemail');
		collection.each(function(entry) {
			newmail.analyse(entry);
		});
		this.context.get('chrome').browserAction.setBadgeText({ text: collection.length + ''});
	},

	/**
	 * Route message from Contetnscript
	 * @access private
	 * @param {Object} message
	 * @param {Object} sender
	 */
	_message: function(message, sender) {
		console.log("[Extension] Received:", message, (this.app)? true : false);
		this.get('router').route(message, { tabId : sender.tab.id});
	},

	/**
	 * Send message to content script
	 * @access private
	 * @param {Object} options
	 * @param {window.gtd.Analysis.Action} action
	 * @param {Object} data
	 */
	_sendMessage: function(options, action, data) {
		var message = (data) ? data : {};
		message['action'] = action;
		console.log("[Extension] Send:", message, options.tabId);
		this.context.get('chrome').tabs.sendMessage(options.tabId, message);		
	}

});