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
		'#gtd' : true,
		'#nex' : true,
		'#wai' : true,
		'#cal' : true,
		'#som' : true,
		'#pro' : true,
		'#con' : true,
		'#dat' : true
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
		
		if (!data['#text']) {
			return null;
		}
		var tags = this._createTags(data['#text']);
		var action = this.get('context').get('actions').createAction(entry, tags);

		action.set('label', this._labelsMap[data['#label']]);
		if (data['#project']) {
			action.set('project', data['#project']);
		}
		if (data['#context']) {
			action.set('context', data['#context']);
		}
		if (data['#date']) {
			action.set('date', data['#date']);
		}

		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : msgid,
			'action': action
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
		var text = [];
		//	#next, #waiting, #calendar, #someday
		
		for(var i = 0; i<parts.length; i++) {
			if (!parts[i]) {
				continue;
			}
			var part = parts[i];
			// Keyword detection
			var isKeyword = (this._keyWordsPrefix[part.slice(0,4)] === true);
			if (state === 0 && !isKeyword) {
				text.push(part);
				continue;
			}
			
			if (isKeyword) {
				state = 1;
			}
			
			if (state === 1) { //nothing
				key = part;
				if (key == '#gtd') {
					data[key] = null;
					state = 0;
				} else if (this._actions[key]){
					if (label === null || label == "#project") {
						label = this._actions[key];
						data['#label'] = label;
					}
					// project has second part
					state = (key == '#project') ? 2 : 0;
				} else {
					data[key] = null;
					state = 2;
				}
			} else if (state === 2) { //key detected
				data[key] = part;
				if (key == "#date") {
					state = 0;
				} else {
					state = 3;
				}
			} else { //detect next part
				data[key] = data[key] + ' ' + part;
			}
		}
		data['#text'] = text.join(' ');
		//Buy milk #gtd #next #date 2012-01-01
		//#label 2
		//#deadline 2013-02-28 18:24
		return data;
	}
});