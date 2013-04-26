"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Analysis.ActionCollection", {
	context: null,
	parser: null,
	
	setUp: function() {
		this.context = new window.gtd.Context({
			'logger' : console
		});
		
	},
	
	testSearch: function() {
		var db = {
			cursor : function(keyVal, primaryKeyVal) {
				this.key = function() {
					return keyVal;
				};
				this.primaryKey = function() {
					return primaryKeyVal;
				};
			},

			values: function(store, keys) {
				return {
					done: function(callback) {
						return callback(keys);
					}
				};
			},
			
			open: function(iter, callback) {
				_.each(['f','g','m','n','o'], function(val,idx) {
					var cur = new this.cursor(val, idx);
					callback(cur);
				}, this);
				return {
					then: this.then
				};
			},
			
			then: function(callback) {
				callback();
			}
		};
		this.context.set('db', db);
		
		var collection1 = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });	
		collection1.on('search:result', function(results ,entry, tags) {
			assertEquals([0,2,4], results);
		});
		collection1.search(null, ['m', 'o', 'f']);
	},
	
	testInsertDb: function() {
		var db = {
			put: function(store, obj) {
				return {
					done: this.done,
					fail: this.fail
				};
			},
			
			done: function(callback) {
				callback();
			},
			fail: function(callback) {
				//
			}
		};
		this.context.set('db', db);
		
		var collection1 = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });	
		var inserted = false;
		collection1.on('change:insertdb', function(results ,entry, tags) {
			inserted = true;
		});
		collection1.insertDb(new Backbone.Model());
		assertTrue(inserted);
	},
	
	testRemoveDb: function() {
		var db = {
				remove: function(store, obj) {
					return {
						done: this.done,
						fail: this.fail
					};
				},
				
				done: function(callback) {
					callback();
				},
				fail: function(callback) {
					//
				}
			};
			this.context.set('db', db);
			
			var collection1 = new window.gtd.Analysis.ActionCollection([], { 'context' : this.context });	
			var removed = false;
			collection1.on('change:removedb', function(results ,entry, tags) {
				removed = true;
			});
			collection1.removeDb(1, false);
			assertTrue(removed);
	}
});