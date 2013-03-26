"use strict";

window.gtd.Settings.SettingsView = Backbone.View.extend({
	actionsView: null,
	patternsView: null,
	
	events: {
		'change input[type="checkbox"]' : '_onCheckBoxChange',
		'click #closeBtn' : '_onCloseClick'
	},
	
	checkboxes: [ 'enabled', 'autoActions', 'advancedMode' ],
	
	initialize: function(options) {
		this.actionsView = new window.gtd.Settings.ActionsView({
			'el' : this.$el.find('#actionsList'),
			'collection' : options.context.get('actions')
		});
		this.patternsView = new window.gtd.Settings.PatternsView({
			'el' : this.$el.find('#patternsList'),
			'collection' : options.context.get('patterns')
		});
		this.render();
		this.actionsView.render();
		this.patternsView.render();
	},
	
	render: function() {
		_.each(this.checkboxes, function(id) {
			var checked = this.model.get(id);
			this.$el.find('#'+id).prop('checked', checked);
		}, this);
	},
	
	_onCheckBoxChange: function(e) {
		var $chkbox = $(e.target);
		var id = $chkbox.attr('id');
		var checked = $chkbox.prop('checked');
		this.model.set(id, checked);
	},
	
	_onCloseClick: function(e) {
		window.close();
	}
	
});