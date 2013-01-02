"use strict";

window.gtdBootstrap = {
	app: null,
	
	init: function() {
		window.oauth.authorize(function() {
			console.log("Authorize - Token:" + window.oauth.getAccessToken());
		});
		var db = this._initDb();
		var settings = new window.gtd.Settings.Settings({},{ 'db': db });
	
		var context = new window.gtd.Context({
			'db'       : db,
			'settings' : settings
		});
		
		var suggestions = new window.gtd.Suggestion.SuggestionCollection([], { 'context': context });
		var router = new window.gtd.Suggestion.Router({ 'context': context, 'suggestions' : suggestions });
		router.on('suggestion:show', this._onSuggestionShow);
		
		this.app = new window.gtd.Application({
			'context'  : context,
			'gmail'    : new window.gtd.Gmail.NewList([], { 'oauth': window.oauth }),
			'imap'     : new window.gtd.Gmail.Imap({ 'oauth': window.oauth }),
			'newemail' : this._createNewEmail(context, suggestions),
			'router'   : router
		});
		
		this.app.runBackground();
	},

	refresh: function() {
		if (this.app) {
			this.app.runBackground();
		}
	},
	
	message: function(message, sender) {
		console.log("[Extension] Received:", message, (this.app)? true : false);
		if (this.app) {
			if (message.action == 'open') {
				this.app.get('router').emailOpen(message.msgId, { tabId : sender.tab.id});
			}
		}
	},

	_onSuggestionShow: function(suggestion, options) {
		var message = {
			'action' : 'show',
			'suggestion' : suggestion
		};
		console.log("[Extension] Send:", message, options);
		window.chrome.tabs.sendMessage(options.tabId, message);
	},
	
	_createNewEmail: function(context, suggestions) {
		var topia = new window.gtd.Analysis.Topia.TermExtraction();
		
		return new window.gtd.Analysis.NewEmail( { 
			'context' : context,
			'actions' : new window.gtd.Analysis.ActionCollection([], { 'context': context }),
			'suggestions' : suggestions,
			'termextraction': new window.gtd.Analysis.TermExtraction(),
			'topia' : topia
		});
	},
	
	_initDb: function() {
		var schema = {
			stores : [
				{ name: 'actions', keyPath: 'id', autoIncrement: true, indexes: [{ keyPath: 'tags', unique: false, multiEntry: true }]},
				{ name: 'settings', keyPath: 'id' },
				{ name: 'suggestions', keyPath: 'id'}
			]
		};
	
		/**
		 * Create and initialize the database. Depending on platform, this will
		 * create IndexedDB or WebSql or even localStorage storage mechanism.
		 * @type {ydn.db.Storage}
		 */
		var db = new window.ydn.db.Storage('gtd', schema, { mechanisms: ["indexeddb"] });
		return db;
	}
};

_.bindAll(window.gtdBootstrap);
document.addEventListener('DOMContentLoaded', window.gtdBootstrap.init);
window.chrome.browserAction.onClicked.addListener(window.gtdBootstrap.refresh);
window.chrome.extension.onMessage.addListener(window.gtdBootstrap.message);