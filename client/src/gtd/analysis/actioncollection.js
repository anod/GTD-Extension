"use strict";

window.gtd.Analysis.ActionCollection = Backbone.Collection.extend({
	STORE_NAME: 'actions',
	context: null,
	
	initialize: function(model, options) {
		this.context = options.context;
	},
	
	search: function(entry, tags) {
		var db = this.context.get('db');
		var store = this.STORE_NAME;
		db.run(function (tdb) { 
			for(var i = 0; i< tags.length; i++) {
				var range = window.ydn.db.KeyRange.only(tags[i]);
				console.log(tags[i]);
				tdb.list(store, 'tags', range).done(function(records) {
					console.log(records);
					//	records.map(function(x) {
					//	console.log(x.first + ' ' + x.last + ' ' + new Date(x.born));
					//	});
				});
			}
		}, [this.STORE_NAME], "readonly");
		//topic
		var actions = [];
		return actions;
	},

	createAction: function(entry, tags) {
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