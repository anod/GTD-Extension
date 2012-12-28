"use strict";

window.gtd.Context = Backbone.Model.extend({

	defaults : {
		db: null,
		settings: null,
		oauth: window.oauth,
		chrome: window.chrome,
		notification: window.notification
	}
	
});