"use strict";

window.gtdApp = null;
function init() {
	window.oauth.authorize(function() {
		console.log("Authorize - Token:" + window.oauth.getAccessToken());
	});
	var db = initDb();
	var settings = new window.gtd.Settings.Settings({},{ 'db': db });

	var context = new window.gtd.Context({
		'db'       : db,
		'settings' : settings
	});
	
	window.gtdApp = new window.gtd.Application({
		'context'  : context,
		'gmail'    : new window.gtd.Gmail.NewList([], { 'oauth': window.oauth }),
		'imap'     : new window.gtd.Gmail.Imap({ 'oauth': window.oauth }),
		'newemail' : new window.gthd.Analysis.NewEmail()
	});
	
	window.gtdApp.runBackground();
}

function initDb() {
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
	var db = new window.ydn.db.Storage('todos', schema, { mechanisms: ["indexeddb"] });
	return db;
}

function refresh() {
	if (window.gtdApp) {
		window.gtdApp.runBackground();
	}
}

document.addEventListener('DOMContentLoaded', init);

window.chrome.browserAction.onClicked.addListener(refresh);