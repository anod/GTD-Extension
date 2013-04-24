"use strict";

window.gtd.Analysis.InstantParser = Backbone.Model.extend({
	_actions : {
		'#next' : window.gtd.Label.NEXT_ACTION,
		'#waiting' : window.gtd.Label.WAITINGFOR,
		'#calendar' : window.gtd.Label.CALENDAR,
		'#someday' : window.gtd.Label.SOMEDAY,
		'#project' : window.gtd.Label.PROJECT
	},
	
	_keyWordsPrefix : {
		'#next' : true,
		'#wait' : true,
		'#cale' : true,
		'#some' : true,
		'#proj' : true,
		'#cont' : true,
		'#date'	: true
	},
	
	defaults : {
		'context' : null
	},
	
	test: function(subject) {
		return (subject.indexOf("#gtd") != -1);
	},
	
	_createTags: function(text) {
		var tags = this.get('context').get('termextraction').extract(text);
		return this.get('context').get('tagfilter').filter(tags);
	},
	
	parse: function(entry) {
		var src = entry.get('title');
		var msgid = entry.get('mailid');
		var data = this._parse(src);

		if (!this._labelsMap[data['#label']]) {
			return null;
		}
		
		var text = data['#text'];
		var tags = this._createTags(text);
		var action = this.get('context').get('actions').createAction(entry, tags);
		

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
	
	/**
	 * State machine
	 * @param src
	 * @returns {}
	 */
	_parse: function(src) {
		var parts = src.replace(/[\n]+/,' ').split(' ');
		var state = 0;
		var key = null;
		var label = null;

		var data = {};
		
		//	#next, #waiting, #calendar, #someday
		
		for(var i = 0; i<parts.length; i++) {
			if (!parts[i]) {
				continue;
			}
			var part = parts[i];
			// Keyword detection
			if (this._keyWordsPrefix[part.slice(0,4)]) {
				state = 0;
			}
			if (state === 0) { //nothing
				key = part;
				data[key] = null;
				if (key == '#gtd') {
					state = 0;
				} else if (this._actions[key]){
					label = this._actions[key];
					data['#label'] = label;
					// project has second part
					state = (key == '#project') ? 1 : 0;
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
			} else { //detect next part
				data[key] = data[key] + ' ' + part;
			}
		}
		//Buy milk #gtd #next #date 2012-01-01
		//#label 2
		//#deadline 2013-02-28 18:24
		return data;
	}
});