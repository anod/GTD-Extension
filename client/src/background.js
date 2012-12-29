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
		this.app = new window.gtd.Application({
			'context'  : context,
			'gmail'    : new window.gtd.Gmail.NewList([], { 'oauth': window.oauth }),
			'imap'     : new window.gtd.Gmail.Imap({ 'oauth': window.oauth }),
			'newemail' : this._createNewEmail(context)
		});
		
		this.app.runBackground();
	},

	refresh: function() {
		if (this.app) {
			this.app.runBackground();
		}
	},
	
	_createNewEmail: function(context) {
		var topia = new window.gtd.Analysis.Topia.TermExtraction();
		
		return new window.gtd.Analysis.NewEmail( { 
			'context' : context,
			'similarsearch' : new window.gtd.Analysis.SimilarSearch({}, { 'context': context }),
			'termextraction': new window.gtd.Analysis.TermExtraction(),
			'topia' : topia
		});
	},
	
	_initDb: function() {
		var schema = {
			stores : [
				{ name: 'actions' },
				{ name: 'settings' },
				{ name: 'suggestions'}
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