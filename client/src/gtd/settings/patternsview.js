"use strict";

window.gtd.Settings.PatternsView = Backbone.View.extend({
	
	events: {
		"click a.act-edit": "_onEditClick",
		"click a.act-delete": "_onDeleteClick"
	},
	
	initialize: function() {
		this.collection.on('sync', this.render, this);
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
		var el = '<li class="noitems">No itmes</li>';
		this.$el.append(el);
	},
	
	_renderItem: function(pattern, idx) {
		var lines = [];
		var firstLine = '';
		var id = pattern.get('id');
		
		if (pattern.get('from')) {
			firstLine = '<div class="pattern-from"><strong>From:</strong> '+pattern.escape('from')+'</div>';
		}
		if (firstLine !== '') {
			lines.push(firstLine);
		}
		if (pattern.get('content')) {
			lines.push('<div class="pattern-content"><strong>Match:</strong> '+this._renderRegex(pattern.escape('content'))+'</div>');
		}
		if (pattern.get('action')) {
			lines.push('<div class="pattern-content"><strong>Action:</strong> '+window.gtd.Label[pattern.escape('action')].replace('GTD/','')+'</div>');
		}

		var res = '<strong>Result:</strong> '+this._renderType(pattern.get('type'));
		if (pattern.get('value')) {
			res+=" with value '"+pattern.get('value')+"'";
		}
		
		lines.push('<div class="pattern-content">'+res+'</div>');
		
		var html = '<li><div class="item-data">' + lines.join('') + '</div>';
		if (pattern.get('editable')) {
			html += '<a href="#" class="act-btn act-edit advanced-mode" title="Edit pattern"><i class="icon-edit" data-id="'+id+'" ></i></a>' +
					'<a href="#" class="act-btn act-delete" title="Delete pattern"><i class="icon-delete" data-id="'+id+'" ></i></a>';
		}
		html += '</li>';
		return html;
	},
	
	_renderRegex: function(regex) {
		var stripped = regex;//.substring(1,regex.length - 1);
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
			return 'Fill project name';
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
		this.trigger('edit:click', this.collection.get($el.data('id')));
		e.preventDefault();
	},

	_onDeleteClick: function(e) {
		var $el = $(e.target);
		var pattern = this.collection.get($el.data('id'));
		this.collection.removeDb(pattern.get('id'), true);
		e.preventDefault();
	}
});