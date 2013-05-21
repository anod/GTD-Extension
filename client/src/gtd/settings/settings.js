"use strict";
/**
 * Model represents state of settings with localStorage backend
 * @author alex
 */
window.gtd.Settings.Settings = Backbone.Model.extend({

	context: null,
	
	defaults: {
		firstTime: true,
		enabled: true,
		autoActions: true,
		advancedMode: false,
		actionTreshold: 80,
		hotkey: 'ctrl+shift+a'
	},
	
	/**
	 * @override
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	initialize: function(attributes, options) {
		this.context = options.context;
		this.localStorage = options.localStorage;
		this._readLocal();
		this.on('change', function() {
			this._saveLocal();
		}, this);
	},
	
	
	/**
	 * Sync from db
	 * @override
	 * @returns
	 */
	sync: function(method, self, options) {
		this._readLocal();
	},
	
	/**
	 * @access private
	 * @returns {Boolean}
	 */
	_readLocal: function() {
		if (!this.localStorage['gtd_settings']) {
			return false;
		}
		var obj = JSON.parse(this.localStorage['gtd_settings']);
		this.set(obj, { silent: true });
		return true;
	},

	/**
	 * @access private
	 */
	_saveLocal: function() {
		var data = this.toJSON();
		this.localStorage['gtd_settings'] = JSON.stringify(data);
	}
});