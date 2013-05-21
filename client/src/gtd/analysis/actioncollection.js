"use strict";
/**
 * Class to handle collection of actions.
 * With IndexedDb as backend
 * @author alex
 */
window.gtd.Analysis.ActionCollection = Backbone.Collection.extend({
	STORE_NAME: 'actions',
	context: null,
	
	/**
	 * @override
	 * @param model
	 * @param options
	 */
	initialize: function(model, options) {
		this.context = options.context;
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
	
	/**
	 * Look in database for previously stored actions with similar tags
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 * @event search:result when search is finished
	 */
	search: function(entry, tags) {
		tags.sort();
		var tagsHash = _.object(tags, tags);

		var db = this.context.get('db');
		var range = window.ydn.db.KeyRange.bound(tags[0], tags[tags.length-1]);
		var iter = new window.ydn.db.Iterator(this.STORE_NAME, 'tags', range);
		var keysHash = {};
		var keys = [];
		var i=0;
		var req = db.open(iter, function(cursor) {
			if (!tagsHash[cursor.key()]) {
				return tags[++i]; // jump to next index position.
			}
			var key = cursor.primaryKey();
			console.log('Found key ', key);
			// we got the result
			if (!keysHash[key]) { // remove duplicate
				keysHash[key] = true;
				keys.push(key);
			}
		}).then(_.bind(function() {
			if (keys.length > 0) {
				db.values(this.STORE_NAME, keys).done(_.bind(function(results) {
					this.trigger('search:result',results,entry, tags);
				},this));
			} else {
				this.trigger('search:result',[],entry, tags);
			}
		}, this));
		//topic
		var actions = [];
		return actions;
	},

	/**
	 * Create new action from email entry and tags
	 * @param {window.gtd.Gmail.Entry} entry
	 * @param {Array} tags
	 * @returns {window.gtd.Analysis.Action}
	 */
	createAction: function(entry, tags) {
		tags.sort();
		var action = new window.gtd.Analysis.Action({
			'author_email' : entry.get('author_email'),
			'author_name' : entry.get('author_name'),
			'tags': tags
		});
		return action;
	},
	
	/**
	 * Inserts new action into db
	 * @param {window.gtd.Analysis.Action} action
	 * @event change:insertdb
	 */
	insertDb: function(action) {
		var plain = action.toJSON();
		var req = this.context.get('db').put(this.STORE_NAME, plain);
		req.done(_.bind(function(key) {
			this.trigger('change:insertdb', action );
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	},
	
	/**
	 * Remove existing action from db
	 * @param {number} id
	 * @param {boolean} refresh
	 * @event change:removedb
	 */
	removeDb: function(id, refresh) {
		var req = this.context.get('db').remove(this.STORE_NAME, id);
		req.done(_.bind(function(key) {
			this.trigger('change:removedb', id );
			if (refresh) {
				this.fetch();
			}
		}, this));
		req.fail(_.bind(function(error) {
			this.context.get('logger').exception(error);
		}, this));
	}
});