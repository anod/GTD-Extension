"use strict";

window.gtd.Settings.ActionsView = Backbone.View.extend({
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
		var id = action.get('id');
		
		lines.push('<div class="pattern-content">Tags: '+action.get('tags').join(',')+'</div>');
		lines.push('<div class="pattern-content">Action: '+action.get('label').replace('GTD/',''));
		if (action.get('project')) {
			lines.push(' Project: '+action.get('project'));
		}
		if (action.get('context')) {
			lines.push(' Context: '+action.get('context'));
		}
		lines.push('</div>');
		
		var html = '<li><div class="item-data">' +
			lines.join('') + 
			'</div>' +
			'<a href="#" class="act-btn act-edit advanced-mode" title="Edit action" ><i class="icon-edit" data-id="'+id+'"></i></a>' +
			'<a href="#" class="act-btn act-delete" title="Delete action" ><i class="icon-delete" data-id="'+id+'"></i></a>' +
			'</li>'
		;
		return html;
	},
	
	_onEditClick: function(e) {
		
	},
	
	_onDeleteClick:  function(e) {
		var $el = $(e.target);
		console.log($el.data('id'));
		e.preventDefault();
	}
	
});