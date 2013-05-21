"use strict";
/**
 * Parser for External notifications
 * Format of the subject of the email:
 *   "#gtd #mailid 123abs123 #label 2 #context Conext Name #project Project Name #deadline 2015-05-03 10:45"
 * @author alex
 */
window.gtd.External.Parser = Backbone.Model.extend({
	_labelsMap: null,
	
	_keyWordsPrefix : {
		'#gtd' : true,
		'#pro' : true,
		'#con' : true,
		'#dea' : true,
		'#lab' : true,
		'#mai' : true
	},
	
	defaults : {
		'context' : null
	},
	
	/**
	 * @override
	 */
	initialize: function() {
		this._labelsMap = this._initLabelsMap();
	},
	
	/**
	 * Check if subject is notification
	 * @param subject
	 * @returns {Boolean}
	 */
	test: function(subject) {
		return (subject.indexOf("#gtd") != -1 && subject.indexOf("#mailid") != -1);
	},
	
	/**
	 * Create action from title of the email
	 * @param {window.gtd.Gmail.Entry} entry
	 * @returns {window.gtd.Suggestion.Suggestion}
	 */
	parse: function(entry) {
		var src = entry.get('title');
		var data = this._parse(src);
		
		if (!data['#mailid']) {
			return null;
		}
		if (!this._labelsMap[data['#label']]) {
			return null;
		}
		var msgid = data['#mailid'];
		var action = this._createAction(data);

		var suggestion = new window.gtd.Suggestion.Suggestion({
			'id' : msgid,
			'action': new window.gtd.Analysis.Action(action)
		});
		return suggestion;
	},
	
	/**
	 * Data into actions json object
	 * @param {Object} data
	 * @returns {Object}
	 */
	_createAction: function(data) {
		var action = {};
		
		action.label = this._labelsMap[data['#label']];
		if (data['#project']) {
			action.project = data['#project'];
		}
		if (data['#context']) {
			action.context = data['#context'];
		}
		if (data['#deadline']) {
			action.date = data['#deadline'];
		}
		return action;
	},
	
	/**
	 * State machine
	 * @param {String} src
	 * @returns {Object}
	 */
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
			var isKeyword = (this._keyWordsPrefix[part.slice(0,4)] === true);
			if (isKeyword) {
				state = 0;
			} else if (state === 2 && !isKeyword) {
				if (key == '#deadline') {
					continue;
				}
				data[key] = data[key] + ' ' + part;
				continue;
			}
			
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
				state = 2;
			} else {
				state = 0;
			}
		}
		//#mailid 199
		//#label 2
		//#deadline 2013-02-28 18:24
		return data;
	},
	
	/**
	 * Mapping from external labels to internal
	 * @returns {Object}
	 */
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