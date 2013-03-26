"use strict";

window.gtd.Db = {
		
	/**
	 * Create and initialize the database. Depending on platform, this will
	 * create IndexedDB or WebSql or even localStorage storage mechanism.
	 * @return {ydn.db.Storage} 
	 */
	init: function() {
		var schema = {
			stores : [
				{ name: 'actions', keyPath: 'id', autoIncrement: true, indexes: [
					{ keyPath: 'tags', name: 'tags', unique: false, multiEntry: true },
					{ keyPath: 'label', name: 'label', unique: false, multiEntry: false }
				]},
				{ name: 'settings', keyPath: 'id' },
				{ name: 'patterns', keyPath: 'id', autoIncrement: true },
				{ name: 'suggestions', keyPath: 'id' },
				{ name: 'tested', keyPath: 'id'}
			]
		};
	
		var db = new window.ydn.db.Storage('gtd', schema, { mechanisms: ["indexeddb"] });
		return db;
	},
	
	// shortcut to reset data in db: window.gtd.Db.reset();
	reset: function() {
		var db = this._initDb();
		db.clear();
	}
};
