"use strict";

window.gtd.Gmail.UserInfo = Backbone.Model.extend({
	URL: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=',
	defaults: {
		"id": null,
		"email": null,
		"verified_email": false
	},
	context: null,

	initialize: function(attrs, options) {
		this.context = options.context;
		if (!this._initLocal()) {
			this._initRemote();
		}
	},
	
	_initLocal: function() {
		var localStorage = this.context.get('localStorage');
		if (!localStorage['gtd_user']) {
			return false;
		}
		var obj = JSON.parse(localStorage['gtd_user']);
		this.set(obj, { silent: true });
		return true;
	},
	
	_initRemote: function() {
		var token = this.context.get('oauth').getAccessToken();
		$.ajax({
			type: 'GET',
			url: this.URL + token,
			dataType: 'json',
			async : false,
			success: _.bind(function(data){
				this.set(data, { silent: true });
				this._saveLocal(data);
			},this),
			error: function(xhr, type){
				console.error(xhr);
			}
		});
	},
	
	_saveLocal: function(data) {
		var localStorage = this.context.get('localStorage');
		localStorage['gtd_user'] = JSON.stringify(data);
	}
	
});