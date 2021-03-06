"use strict";
/**
 * Shortcut view
 * @author alex
 */
window.gtd.Contentscript.Shortcut = Backbone.View.extend({
	/**
	 * @override
	 */
	initialize: function(options) {
		_.bindAll(this, 'show', 'hide');
		
		this.model.on('change:insideEmail', function(model, value) {
			if (value) {
				this._onEmailOpen();
			} else {
				this._onEmailClose();
			}
		}, this);
		this.model.on('change:settings', function() {
			this.render();
		}, this);
	},
	
	/**
	 * Show shortcut on the screen
	 */
	show: function() {
		this.render();
		this.$el.on('click', 'div.gtd-icon', _.bind(function(e) {
			this.model.trigger('shortcut:clicked', true);
			e.preventDefault();
		},this));
		
		this.$el.on('click', 'div.gtd-info', _.bind(function() {
			if (this.model.get('showDialog')) {
				this.model.set('highlightDialog', true);
				return;
			}
			this.model.set('showDialog', true);
		},this));
		this.$el.find('#gtd-shortcut').show();
	},
	
	/**
	 * Hide shortcut
	 */
	hide: function() {
		this.$el.find('#gtd-shortcut').hide();
		this.$el.remove();
	},
	
	/**
	 * renders from template
	 */
	render: function() {
		var settings = this.model.get('settings');
		if (!settings) {
			return;
		}
		var hotkey = settings.hotkey;
		this.$el.html(this._template(hotkey));
		
		$('body').append(this.$el);
	},
	
	/**
	 * Adds dialog hint animation
	 * @access private
	 */
	_onEmailOpen: function() {
		this.$el.hover(_.bind(function() {
			this.$el.find('.gtd-info')
				.delay(200)
				.animate({
					opacity: 1.0,
					width: '188px'
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
	
	/**
	 * Disable dilaog hint animation
	 * @access private
	 */
	_onEmailClose: function() {
		this.$el.unbind('mouseenter mouseleave');
	},
	
	/**
	 * Html template
	 * @access private
	 * @return {String}
	 */
	_template: function(hotkey) {
		var hotkeyText = this._toTitleCase(hotkey);
		var html = '<div id="gtd-shortcut">' +
			'<div>' +
			'<div class="gtd-section gtd-icon" role="button" tabindex="0"><span class="Tq">&nbsp;</span></div>' +
			'<div class="gtd-section gtd-info" title="Press '+hotkeyText+' to show action dialog">Press <span class="gtd-key">'+hotkeyText+'</span> for action</div>' +
			'</div>' +
		'</div>'
		;
		return html;
	},
	
	/**
	 * Formats text
	 * @access private
	 * @return {String}
	 */
	_toTitleCase: function(str) {
		return str.replace(/[^\+]*/g, function(txt){
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}
	
});