"use strict";

window.gtd.Settings.PatternsView = Backbone.View.extend({
	
	events: {
		"click a.act-edit": "_onEditClick",
		"click a.act-delete": "_onDeleteClick"
	},
	
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
		this.trigger('render:finish');
	},
	
	_renderList: function() {
		var html = [];
		this.collection.each(function(pattern, idx) {
			html.push(this._renderItem(pattern, idx));
		}, this);
		this.$el.html(html.join(''));
	},
	
	_renderEmpty: function() {
		var el = this.make('li', {'class': 'noitems'}, 'No itmes');
		this.$el.append(el);
	},
	
	_renderItem: function(pattern, idx) {
		var lines = [];
		var firstLine = '';
		if (pattern.get('from')) {
			firstLine = '<div class="pattern-from">From: '+pattern.escape('from')+'</div>';
		}
		if (pattern.get('to')) {
			firstLine += '<div class="pattern-to">To: '+pattern.escape('to')+'</div>';
		}
		if (firstLine !== '') {
			lines.push(firstLine);
		}
		if (pattern.get('content')) {
			lines.push('<div class="pattern-content">Match: '+this._renderRegex(pattern.escape('content'))+'</div>');
		} else {
			if (pattern.get('subject')) {
				lines.push('<div class="pattern-content">Subject: '+this._renderRegex(pattern.escape('subject'))+'</div>');
			}
			if (pattern.get('summary')) {
				lines.push('<div class="pattern-content">Summary: '+this._renderRegex(pattern.escape('summary'))+'</div>');
			}
		}
		lines.push('<div class="pattern-content">Action: '+this._renderType(pattern.get('type'))+'</div>');
		
		var html = '<li><div class="item-data">' + lines.join('') + '</div>';
		if (pattern.get('editable')) {
			html += '<a href="#" class="act-btn act-edit advanced-mode" data-idx="'+idx+'" title="Edit pattern"><i class="icon-edit"></i></a>' +
					'<a href="#" class="act-btn act-delete" data-idx="'+idx+'" title="Delete pattern"><i class="icon-delete"></i></a>';
		}
		html += '</li>';
		return html;
	},
	
	_renderRegex: function(regex) {
		var stripped = regex.substring(1,regex.length - 1);
		stripped = stripped.replace(/\\b/g, '');
		stripped = stripped.replace(/&#x2F;/g, '');
		stripped = stripped.replace(/\[\^\\s\]\+/g, '(\\w)');
		stripped = stripped.replace(/\\s[\+\*]?/g, ' ');
		stripped = stripped.replace(/\\d\{1,2\}\\\\d\{1,2\}/g, 'DD\\MM');
		stripped = stripped.replace(/\\d\{1,2\}-\\d\{1,2\}/g, 'DD-MM');
		stripped = stripped.replace(/\\d\{2,4\}/g, 'YYYY');
		stripped = stripped.replace(/\\\./g, '.');

		var parts = stripped.split('|');
		return parts.join(', ');
	},
	
	_escapeRegExp: function(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},
	
	_renderType: function(type) {
		/*
		 * TYPE_DATE: 0,
		 * TYPE_PROJECT_NAME: 1,
		 * TYPE_ACTION: 2,
		 * TYPE_SKIP_ACTION: 3,
		 * TYPE_CONTEXT: 4,
		 */
		if (type === 0) {
			return 'Fill date';
		} else if (type === 1) {
			return 'Match project name';
		} else if (type === 2) {
			return 'Fill action';
		} else if (type === 3) {
			return 'Skip action';
		} else if (type === 4) {
			return 'Fill context';
		}
		throw "Unknown type: " + type;
	},
	
	_onEditClick: function(e) {
		var $el = $(e.target);
		this.trigger('edit:click', this.collection.get($el.data('idx')));
		e.preventDefault();
	},

	_onDeleteClick: function(e) {
		console.log('delete');
		e.preventDefault();
	}
});