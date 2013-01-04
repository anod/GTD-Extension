"use strict";

window.gtd.Analysis.ActionCollection = Backbone.Collection.extend({
	STORE_NAME: 'actions',
	context: null,
	
	initialize: function(model, options) {
		this.context = options.context;
	},
	
	search: function(entry, tags) {
		tags.sort();
		var tagsHash = _.object(tags, tags);

		var db = this.context.get('db');
		var range = window.ydn.db.KeyRange.bound(tags[0], tags[tags.length-1]);
		var iter = new window.ydn.db.KeyIterator(this.STORE_NAME, 'tags', range);
		var keysHash = {};
		var keys = [];
		var i=0;
		var req = db.open(iter, function(cursor) {
			if (!tagsHash[cursor.getIndexKey()]) {
				return tags[++i]; // jump to next index position.
			}
			var key = cursor.getPrimaryKey();
			// we got the result
			if (!keysHash[key]) { // remove duplicate
				keysHash[key] = true;
				keys.push(key);
			}
			return true; // continue to next cursor position
		});
		
		var localTags = _.clone(tags);
		var localEntry = entry.clone();
		req.done(_.bind(function() {
			if (keys.length > 0) {
				db.list(this.STORE_NAME, keys).done(function(results) {
					console.log(entry, tags, results);
				});
			} else {
				this.trigger('search:result',[],localEntry, localTags);
			}
		}, this));
		//topic
		var actions = [];
		return actions;
	},

	createAction: function(entry, tags) {
		tags.sort();
		var action = new window.gtd.Analysis.Action({
			'author_email' : entry.get('author_email'),
			'author_name' : entry.get('author_name'),
			'tags': tags
		});
		return action;
	},
	
	add: function(action) {
		if (_.isArray(action)) {
			return; //Not supported
		}
		var plain = action.toJSON();
		var req = this.context.get('db').put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:add', action );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	}
	
	
});