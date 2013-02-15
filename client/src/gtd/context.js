"use strict";
/**
 * Dependency injection container
 */
window.gtd.Context = Backbone.Model.extend({

	defaults : {
		db: null,
		settings: null,
		oauth: window.oauth,
		chrome: window.chrome,
		notification: window.notification,
		logger: window.simplelogger
	}
	
});