"use strict";

window.gtd.Analysis.InstantParser = Backbone.Model.extend({
	defaults : {
		'context' : null
	},
	
	test: function(subject) {
		return (subject.indexOf("#gtd") != -1);
	},
	
	parse: function(entry) {
		var src = entry.get('title');
		var data = this._parse(src);
		console.log('External data received', data);
	},
	
	_parse: function(src) {
		var data = {};
		return data;
	}
});