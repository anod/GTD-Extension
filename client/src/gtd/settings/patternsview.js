"use strict";

window.gtd.Settings.PatternsView = Backbone.View.extend({
	
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
		var el = this.make('li', {'class': 'noitmes'}, 'No itmes');
		this.$el.append(el);
	},
	
	_renderItem: function(pattern) {
		var lines = [];
		var firstLine = '';
		if (pattern.get('from')) {
			firstLine = '<div clss="pattern-from">From: '+pattern.escape('from')+'</div>';
		}
		if (pattern.get('to')) {
			firstLine += '<div clss="pattern-to">To: '+pattern.escape('to')+'</div>';
		}
		if (firstLine !== '') {
			lines.push(firstLine);
		}
		if (pattern.get('content')) {
			lines.push('<div clss="pattern-content">Content: '+pattern.escape('content')+'</div>');
		} else {
			if (pattern.get('subject')) {
				lines.push('<div clss="pattern-content">Subject: '+pattern.escape('subject')+'</div>');
			}
			if (pattern.get('summary')) {
				lines.push('<div clss="pattern-content">Summary: '+pattern.escape('summary')+'</div>');
			}
		}
		
		
		var html = '<li><div class="item-data">' +
			lines.join('<br/>') + 
			'</div>' +
			'<a href="#" class="act-btn act-edit">Edit</a>' +
			'<a href="#" class="act-btn act-delete">Delete</a>' +
			'</li>'
		;
		return html;
	}

	
});