"use strict";
/**
 * Class to filter not relevant information within tags
 * @author alex
 */
window.gtd.Analysis.TagFilter = Backbone.Model.extend({
	defaults : {
		context: null,
		userinfo: null
	},
	
	list: {},
	
	/**
	 * Adds user information to the list
	 * @override
	 */
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
	
	/**
	 * Filters tags
	 * @param {Array} tags
	 * @returns {Array}
	 */
	filter: function(tags) {
		return _.filter(tags, function(tag){ 
			return (this.list[tag]) ? false : true;
		}, this);
	}
	
	
});