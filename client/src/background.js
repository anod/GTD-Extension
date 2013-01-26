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
	
	_createNewEmail: function(context, suggestions) {	
		return new window.gtd.Analysis.NewEmail({
			'context' : context,
			'actions' : new window.gtd.Analysis.ActionCollection([], { 'context': context }),
			'suggestions' : suggestions,
			'termextraction': new window.gtd.Analysis.TermExtraction(),
			'strikeamatch': new window.gtd.Analysis.StrikeAMatch()
		});
	},
	
	_initDb: function() {
		var schema = {
			stores : [
				{ name: 'actions', keyPath: 'id', autoIncrement: true, indexes: [
					{ keyPath: 'tags', name: 'tags', unique: false, multiEntry: true },
					{ keyPath: 'label', name: 'label', unique: false, multiEntry: false }
				]},
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
	},
	
	// shortcut to reset data in db: window.gtdBootstrap.resetDB();
	resetDB: function() {
		var db = this._initDb();
		db.clear();
	}
};

_.bindAll(window.gtdBootstrap);
document.addEventListener('DOMContentLoaded', window.gtdBootstrap.init);
window.chrome.browserAction.onClicked.addListener(window.gtdBootstrap.refresh);