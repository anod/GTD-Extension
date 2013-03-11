"use strict";

window.gtd.Contentscript.Shortcut = Backbone.View.extend({

	initialize: function() {
		_.bindAll(this, 'show', 'hide');
		this.model.on('change:insideEmail', function(model, value) {
			if (value) {
				this._onEmailOpen();
			} else {
				this._onEmailClose();
			}
		}, this);
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
		
		$('body').append(this.$el);
		
		this.$el.on('click', 'div.gtd-icon', _.bind(function() {
			console.log('icon clicked');
			this.model.set('iconClicked', true);
		},this));
		
		this.$el.find('#gtd-shortcut').show();
	},
	
	_onEmailOpen: function() {
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
	},
	
	_onEmailClose: function() {
		this.$el.unbind('mouseenter mouseleave');
	},
	
	_template: function() {
		var html = '<div id="gtd-shortcut">' +
			'<div>' +
			'<div class="gtd-section gtd-icon" role="button" tabindex="0"><span class="Tq">&nbsp;</span></div>' +
			'<div class="gtd-section gtd-info" title="Press Shift+A to show action dialog">Press <span class="gtd-key">Shift+A</span> for action</div>' +
			'</div>' +
		'</div>'
		;
		return html;
	}
});