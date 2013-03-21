"use strict";

window.gtd.Pattern.PatternCollection = Backbone.Collection.extend({
	STORE_NAME: 'patterns',
	context: null,
	
	initialize: function(model, options) {
		this.context = options.context;
	},
	
	match: function(entry) {
		var db = this.context.get('db');
		db.values(this.STORE_NAME).done(_.bind(function(records) {
			_.each(records, function(json) {
				var pattern = new window.gtd.Pattern.Pattern(json);
				if (this._testPattern(pattern, entry)) {
					this._applyPattern(pattern, entry);
				}
			});
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
	
	_applyPattern: function(pattern, entry) {
		
	},
	
	_testPattern: function(pattern, entry) {
		var patt = null;
		var result = null;
		var data = [];
		if (pattern.get('from')) {
			var fromName = entry.get('author_name');
			var fromEmail = entry.get('author_email');
			patt = new RegExp(pattern.get('from'));
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
			patt = new RegExp(pattern.get('content'),'g');
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
				patt = new RegExp(pattern.get('subject'),'g');
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
				patt = new RegExp(pattern.get('summary'),'g');
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