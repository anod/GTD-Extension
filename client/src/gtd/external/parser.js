"use strict";

window.gtd.External.Parser = Backbone.Model.extend({
	_labelsMap: null,
	
	defaults : {
		'context' : null
	},
	
	initialize: function() {
		this._labelsMap = this._initLabelsMap();
	},
	
	test: function(subject) {
		return (subject.indexOf("#gtd") != -1 && subject.indexOf("#mailid") != -1);
	},
	
	parse: function(entry) {
		var src = entry.get('title');
		var data = this._parse(src);
		
		if (!data['#mailid']) {
			return null;
		}
		var msgid = data['#mailid'];
		var action = {};
		
		if (!this._labelsMap[data['#label']]) {
			return null;
		}
		action.label = this._labelsMap[data['#label']];
		if (data['#project']) {
			action.project = data['#project'];
		}
		if (data['#context']) {
			action.project = data['#context'];
		}
		if (data['#deadline']) {
			action.date = data['#deadline'];
		}

		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : msgid,
			'action': new window.gtd.Analysis.Action(action)
		});
		return suggestion;
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
				//data[key] = data[key] + ' ' + part;
				state = 0;
			}
		}
		//#mailid 199
		//#label 2
		//#deadline 2013-02-28 18:24
		return data;
	},
	
	_initLabelsMap: function() {
		var labels = {};
		labels[window.gtd.External.Api.Consts.NEXT_ACTION_LABEL_ID] = window.gtd.Label.NEXT_ACTION;
		labels[window.gtd.External.Api.Consts.WATING_ON_LABEL_ID] = window.gtd.Label.WAITINGFOR;
		labels[window.gtd.External.Api.Consts.DELAYED_LABEL_ID] = window.gtd.Label.CALENDAR;
		labels[window.gtd.External.Api.Consts.SOMEDAY_LABEL_ID] = window.gtd.Label.SOMEDAY;
		labels[window.gtd.External.Api.Consts.PROJECT_LABEL_ID] = window.gtd.Label.PROJECT;
		
		return labels;
	}
});