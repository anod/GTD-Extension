"use strict";

window.gtd.Contentscript.Shortcut = Backbone.View.extend({
	$shortcut: null,
	initialize: function() {
		_.bindAll(this, 'show', 'hide');
	},
	
	show: function() {
		this.render();
	},
	
	hide: function() {
		this.$el.find('#gtd-shortcut').hide();
		this.$el.remove();
	},
	
	render: function() {
		this.$el.html(this._template());
		
		this.$el.hover(_.bind(function() {
			this.$el.find('.gtd-info')
				.delay(200)
				.animate({
					opacity: 1.0,
					width: '148px'
				}, 500);
		}, this),_.bind(function() {
			this.$el.find('.gtd-info')
				.delay(200)
				.animate({
					opacity: 0,
					width: '0px'
				}, 500);
		}, this));
		
		$('body').append(this.$el);
		this.$el.find('#gtd-shortcut').show();
	},
	
	_template: function() {
		var html = '<div id="gtd-shortcut">' +
			'<div>' +
			'<div class="gtd-section gtd-icon" title="GTD Action" role="button" tabindex="0"><span class="Tq">&nbsp;</span></div>' +
			'<div class="gtd-section gtd-info" title="Press shortcut to show action dialog">Press <span class="gtd-key">Shift+E</span> for action</div>' +
			'</div>' +
		'</div>'
		;
		return html;
	}
});