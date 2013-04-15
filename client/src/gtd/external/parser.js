"use strict";

window.gtd.External.Parser = Backbone.Model.extend({
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
		var parts = src.replace(/[\n]+/,' ').split(' ');
		var state = 0;
		var key = null;
		var data = {};
		for(var i = 0; i<parts.length; i++) {
			if (!parts[i]) {
				continue;
			}
			var part = parts[i];
			if (state === 0) { //nothing
				key = part;
				data[key] = null;
				if (key == '#gtd') {
					state = 0;
				} else {
					state = 1;
				}
			} else if (state === 1) { //key detected
				data[key] = part;
				if (key == "#deadline") {
					state = 2;
				} else {
					state = 0;
				}
			} else { //detect second part
				data[key] = data[key] + ' ' + part;
				state = 0;
			}
		}
		//#mailid 199
		//#label 2
		//#deadline 2013-02-28 18:24
		return data;
	}
	
});