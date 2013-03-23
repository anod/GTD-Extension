"use strict";

window.gtd.Settings.Settings = Backbone.Model.extend({
	db: null,
	
	defaults: {
		firstTime: true,
		enabled: true,
		mode: 1,
		suggestionTreshold: 80
	},
	
	initialize: function(attributes, options) {
		this.db = options.db;
		this.localStorage = options.localStorage;
		this._initLocal();
		this.on('change', function() {
			this._saveLocal();
		}, this);
	},
	
	_initLocal: function() {
		if (!this.localStorage['gtd_settings']) {
			return false;
		}
		var obj = JSON.parse(this.localStorage['gtd_settings']);
		this.set(obj, { silent: true });
		return true;
	},

	_saveLocal: function() {
		var data = this.toJSON();
		this.localStorage['gtd_settings'] = JSON.stringify(data);
	}
});