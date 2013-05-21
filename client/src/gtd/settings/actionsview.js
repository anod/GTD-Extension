"use strict";
/**
 * Class represents view of the list of actions
 * @author alex
 */
window.gtd.Settings.ActionsView = Backbone.View.extend({
	events: {
		"click a.act-delete": "_onDeleteClick"
	},
	
	/**
	 * @override
	 */
	initialize: function() {
		this.collection.on('sync', this.render, this);
	},
	
	/**
	 * @override
	 */
	render: function() {
		this.$el.empty();
		if (this.collection.isEmpty()) {
			this._renderEmpty();
		} else {
			this._renderList();
		}
		this.trigger('render:finish');
	},
	
	/**
	 * @access private
	 */
	_renderList: function() {
		var html = [];
		this.collection.each(function(pattern) {
			html.push(this._renderItem(pattern));
		}, this);
		this.$el.html(html.join(''));
	},
	
	/**
	 * @access private
	 */
	_renderEmpty: function() {
		var el = '<li class="noitems">No actions stored</li>';
		this.$el.append(el);
	},
	
	/**
	 * 
	 * @access private
	 * @param {window.gtd.Analysis.Action} action
	 * @returns {String}
	 */
	_renderItem: function(action) {
		var lines = [];
		var id = action.get('id');
		
		lines.push('<div class="pattern-content"><strong>Tags:</strong>'+action.get('tags').join(',')+'</div>');
		lines.push('<div class="pattern-content"><strong>Action</strong> '+action.get('label').replace('GTD/',''));
		if (action.get('project')) {
			lines.push(', <strong>Project</strong> "'+action.get('project')+'"');
		}
		if (action.get('context')) {
			lines.push(', <strong>Context</strong> "'+action.get('context')+'"');
		}
		lines.push('</div>');
		
		var html = '<li><div class="item-data">' +
			lines.join('') + 
			'</div>' +
			'<a href="#" class="act-btn act-delete" title="Delete action" ><i class="icon-delete" data-id="'+id+'"></i></a>' +
			'</li>'
		;
		return html;
	},

	/**
	 * @access private
	 * @param e
	 */
	_onDeleteClick:  function(e) {
		var $el = $(e.target);
		var action = this.collection.get($el.data('id'));
		this.collection.removeDb(action.get('id'), true);
		e.preventDefault();
	}
	
});