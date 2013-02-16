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
			'oauth'    : window.oauth,
			'db'       : db,
			'settings' : settings,
			'gmail'    : new window.gtd.Gmail.NewList([], { 'oauth': window.oauth }),
			'termextraction': new window.gtd.Analysis.TermExtraction(),
			'strikeamatch': new window.gtd.Analysis.StrikeAMatch()
		});
		var imap = new window.gtd.Gmail.Imap({ 'context': context, 'oauth': window.oauth });
		context.set('imap', imap);
		
		var suggestions = new window.gtd.Suggestion.SuggestionCollection([], { 'context': context });
		context.set({'suggestions' : suggestions});
		
		var router = new window.gtd.Suggestion.Router({
			'context': context,
			'suggestions': context.get('suggestions')
		});
		
		context.set('actions', new window.gtd.Analysis.ActionCollection([], { 'context': context }));
		context.set('suggestions', suggestions);
		context.set('newemail', new window.gtd.Analysis.NewEmail({
			'context' : context,
			'actions' : context.get('actions'),
			'suggestions' : context.get('suggestions'),
			'termextraction': context.get('termextraction'),
			'strikeamatch': context.get('strikeamatch')
		}));
		context.set('router', router);
		context.set('notifier', new window.gtd.External.Notifier({ 'context' : context, 'imap' : imap  }));
		
		this.app = new window.gtd.Application({
			'context'  : context,
			'gmail'    : context.get('gmail'),
			'newemail' : context.get('newemail'),
			'imap'     : context.get('imap'),
			'router'   : context.get('router')
		});
		context.set('app', this.app);
		this.app.runBackground();
	},

	refresh: function() {
		if (this.app) {
			this.app.runBackground();
		}
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