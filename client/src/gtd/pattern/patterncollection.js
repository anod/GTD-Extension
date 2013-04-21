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
		{ 'from' : null, 'content' : window.gtd.Pattern.Regex.DATE, 'type' : 0 , 'insensitive': true , 'editable' : false},
		{ 'from' : null, 'content' : window.gtd.Pattern.Regex.PROJECT_NAME, 'type' : 1, 'insensitive' : true, 'editable' : false },
		{ 'from' : null, 'content' : window.gtd.Pattern.Regex.ACTION, 'type' : 2, 'insensitive' : true, 'editable' : false },
		{ 'from' : null, 'content' : window.gtd.Pattern.Regex.CONTEXT, 'type' : 4, 'insensitive' : true, 'editable' : false }
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
	
	/**
	 * Sync from db
	 * @override
	 * @returns
	 */
	sync: function(method, self, options) {
		var db = this.context.get('db');
		db.values(this.STORE_NAME).done(_.bind(function(records) {
			options.success(records, null, null);
		}));
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
			this.context.trigger('patterns:fill', entry, action);
		}, this));
		
	},
	
	createPattern: function(from,content,type,action) {
		var pattern = new window.gtd.Pattern.Pattern({
			'from' : from,
			'content' : content,
			'type' : type,
			'action': action
		});
		return pattern;
	},
	
	/**
	 * Insert directly to Db
	 * @Override
	 * @param pattern
	 */
	insertDb: function(pattern) {
		if (_.isArray(pattern)) {
			return; //Not supported
		}
		var plain = pattern.toJSON();
		var req = this.context.get('db').put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:insertdb', pattern );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	},
	
	_applyPattern: function(pattern, entry, action) {
		var type = pattern.get('type');
		var matches = pattern.get('data');
		var match = matches[0];
		
		console.log("Matched", type, match);

		if (type == this.TYPE_DATE) {
			var date = this._matchToDate(match);
			if (date !== null) {
				action.set('date', date);
			}
		} else if (type == this.TYPE_PROJECT_NAME) {
			action.set('project', this._matchToProject(match));
		} else if (type == this.TYPE_ACTION) {
			action.set('label', this._matchToAction(match));
		} else if (type == this.TYPE_CONTEXT) {
			action.set('context', this._matchToContext(match));
		}
	},

	_matchToProject: function(match) {
		var prjStr = match[0];
		if (!prjStr) {
			return "";
		}
		
		return prjStr.replace(/\bproject\s+/i,'');
		
	},
	
	_matchToContext: function(match) {
		var ctxStr = match[0];
		if (!ctxStr) {
			return "";
		}
		if (ctxStr.indexOf('context ') === 0) {
			return ctxStr.replace(/\bcontext\s+/i,'');
		}
		//youtube.com
		return 'Video';
	},
	
	_matchToAction: function(match) {
		var actStr = match[0];
		if (!actStr) {
			return "";
		}
		actStr = actStr.toLowerCase().replace(' ','');
		if  (actStr == "nextaction") {
			return window.gtd.Label.NEXT_ACTION;
		} else if (actStr == "project") {
			return window.gtd.Label.PROJECT;
		} else if (actStr == "waitingfor") {
			return window.gtd.Label.WAITINGFOR;
		} else if (actStr == "calendar") {
			return window.gtd.Label.CALENDAR;
		} else if (actStr == "someday") {
			return window.gtd.Label.SOMEDAY;
		}
		return "";
	},
	
	_matchToDate: function(match) {
		var dateStr = match[0];
		if (!dateStr) {
			return null;
		}
		var date = null;
		var patt = null;
		dateStr = dateStr.toLowerCase().replace(' ','');
		if  (dateStr == "weekend" || dateStr == "thisweekend") {
			date = this.context.get('dateutils').getThisWeekend();
		} else if(dateStr == "nextweekend") {
			date = this.context.get('dateutils').getNextWeekend();
		} else if (dateStr == "today") {
			date = this.context.get('dateutils').getToday();
		} else if (dateStr == "tomorrow") {
			date = this.context.get('dateutils').getTomorrow();
		} else if (dateStr == "nextweek") {
			date = this.context.get('dateutils').getNextWeek();
		} else if (dateStr == "nextmonth") {
			date = this.context.get('dateutils').getNextMonth();
		} else {
			date = this.context.get('dateutils').parseDate(dateStr);
		}
		return date;
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
			
		}
		pattern.set('data',data);
		return true;
	}
});