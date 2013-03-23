"use strict";

window.gtd.Analysis.TagFilter = Backbone.Model.extend({
	defaults : {
		context: null,
		userinfo: null
	},
	
	list: {},
	
	initialize : function() {
		var given_name = this.get('userinfo').get("given_name");
		if (given_name) {
			this.list[given_name.toLowerCase()] = true;
		}
		var family_name = this.get('userinfo').get("family_name");
		if (family_name) {
			this.list[family_name.toLowerCase()] = true;
		}
	},
	
	filter: function(tags) {
		return _.filter(tags, function(tag){ 
			return (this.list[tag]) ? false : true;
		}, this);
	}
	
	
});