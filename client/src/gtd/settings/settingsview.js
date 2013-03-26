"use strict";

window.gtd.Settings.SettingsView = Backbone.View.extend({
	
	events: {
		'change input[type="checkbox"]' : '_onCheckBoxChange'
	},
	
	checkboxes: [ 'enabled', 'autoActions', 'advancedMode' ],
	
	initialize: function() {
		this.render();
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
	}
	
});