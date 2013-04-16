"use strict";

window.gtd.Settings.ActionsView = Backbone.View.extend({

	initialize: function() {
		this.collection.on('reset', this.render, this);
	},
	
	render: function() {
		this.$el.empty();
		if (this.collection.isEmpty()) {
			this._renderEmpty();
		} else {
			this._renderList();
		}
	},
	
	_renderList: function() {
		var html = [];
		this.collection.each(function(pattern) {
			html.push(this._renderItem(pattern));
		}, this);
		this.$el.html(html.join(''));
	},
	
	_renderEmpty: function() {
		var el = this.make('li', {'class': 'noitems'}, 'No actions stored');
		this.$el.append(el);
	},
	
	_renderItem: function(action) {
		var lines = [];
		console.log(action);
		
		var html = '<li><div class="item-data">' +
			lines.join('') + 
			'</div>' +
			'<a href="#" class="act-btn act-edit"><i class="icon-edit"></i></a>' +
			'<a href="#" class="act-btn act-delete"><i class="icon-delete"></i></a>' +
			'</li>'
		;
		return html;
	}
});