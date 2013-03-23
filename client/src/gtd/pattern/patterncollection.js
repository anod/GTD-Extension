"use strict";

window.gtd.Pattern.PatternCollection = Backbone.Collection.extend({
	STORE_NAME: 'patterns',
	
	TYPE_DATE: 0,
	TYPE_PROJECT_NAME: 1,
	TYPE_ACTION: 2,
	TYPE_SKIP_ACTION: 3,
	TYPE_CONTEXT: 4,
	
	context: null,
	
	_initPatterns: [
		{ 'from' : null, 'subject': null, 'summary' : null, 'content' : window.gtd.Pattern.Regex.DATE, 'type' : 0 , 'insensitive': true},
		{ 'from' : null, 'subject': null, 'summary' : null, 'content' : window.gtd.Pattern.Regex.PROJECT_NAME, 'type' : 1, 'insensitive' : true },
		{ 'from' : null, 'subject': null, 'summary' : null, 'content' : window.gtd.Pattern.Regex.ACTION, 'type' : 2, 'insensitive' : true },
		{ 'from' : null, 'subject': null, 'summary' : null, 'content' : window.gtd.Pattern.Regex.CONTEXT, 'type' : 4, 'insensitive' : true }
	],
	
	initialize: function(model, options) {
		this.context = options.context;
		if (this.context.get('settings').get('firstTime')) {
			this._initializeDb();
		}
	},
	
	_initializeDb: function() {
		var db = this.context.get('db');
		_.each(this._initPatterns, function(plain) {
			db
			.add(this.STORE_NAME, plain)
			.fail(_.bind(function(error) {
				this.context.get('logger').exception(error);
			}, this));
		}, this);

	},
	
	fillAction: function(entry, action) {
		var db = this.context.get('db');
		db.values(this.STORE_NAME).done(_.bind(function(records) {
			_.each(records, function(json) {
				var pattern = new window.gtd.Pattern.Pattern(json);
				if (this._testPattern(pattern, entry)) {
					this._applyPattern(pattern, entry, action);
				}
			}, this);
		}, this));
		
	},
	
	createPattern: function(from,subject,summary,content,type,action) {
		var pattern = new window.gtd.Pattern.Pattern({
			'from' : from,
			'subject' : subject,
			'summary' : summary,
			'content' : content,
			'type' : type,
			'action': action
		});
		return pattern;
	},
	
	add: function(pattern) {
		if (_.isArray(pattern)) {
			return; //Not supported
		}
		var plain = pattern.toJSON();
		var req = this.context.get('db').put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:add', pattern );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	},
	
	_applyPattern: function(pattern, entry, action) {
		var type = pattern.get('type');
		if (type == this.TYPE_DATE) {
			var match = pattern.get('data');
			var date = this._matchToDate(match);
			console.log(pattern.get('data'));
		}
	},
	
	_matchToDate: function(match) {
		var dateStr = match[0];
		if (!dateStr) {
			return null;
		}
		var date = null;
		dateStr = dateStr.toLowerCase().replace(' ','');
		if  (dateStr == "weekend" || dateStr == "thisweekend") {
			date = this.context.get('dateutils').getThisWeekend();
		}
	},
	
	_getModifiers: function(pattern) {
		if (pattern.get('insensitive')) {
			return 'i';
		}
		return '';
	},
	
	_testPattern: function(pattern, entry) {
		var patt = null;
		var result = null;
		var data = [];
		var modifiers = this._getModifiers(pattern);
		if (pattern.get('from')) {
			var fromName = entry.get('author_name');
			var fromEmail = entry.get('author_email');
			patt = new RegExp(pattern.get('from'), modifiers);
			var res1 = patt.exec(fromName);
			var res2 = patt.exec(fromEmail);
			if (!res1 && !res2) {
				return false;
			}
			if (res1) {
				data.push(res1);
			}
			if (res2) {
				data.push(res2);
			}
		}
		if (pattern.get('content')) {
			var content = entry.get('title') + " " + entry.get('summary');
			patt = new RegExp(pattern.get('content'),modifiers+'g');
			result = patt.exec(content);
			if (!result) {
				return false;
			}
			if (result) {
				data.push(result);
			}
			
		} else {
			if (pattern.get('subject')) {
				var subject = entry.get('title');
				patt = new RegExp(pattern.get('subject'),modifiers+'g');
				result = patt.exec(subject);
				if (!result) {
					return false;
				}
				if (result) {
					data.push(result);
				}
			}
			if (pattern.get('summary')) {
				var summary = entry.get('summary');
				patt = new RegExp(pattern.get('summary'),modifiers+'g');
				result = patt.exec(summary);
				if (!result) {
					return false;
				}
				if (result) {
					data.push(result);
				}
			}
		}
		pattern.set('data',data);
		return true;
	}
});