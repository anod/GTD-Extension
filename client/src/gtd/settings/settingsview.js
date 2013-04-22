"use strict";

window.gtd.Settings.SettingsView = Backbone.View.extend({
	actionsView: null,
	patternsView: null,
	patternEditView: null,
	
	patterns: null,
	actions: null,
	
	events: {
		'change input[type="checkbox"]' : '_onCheckBoxChange',
		'change input[name="actionTreshold"]' : '_onActionTresholdChange',
		'change input[name="hotkey"]' : '_onHotkeyChange',
		'click #closeBtn' : '_onCloseClick',
		"click a.add-link": "_onPatternAddClick"
	},
	
	checkboxes: [ 'enabled', 'autoActions', 'advancedMode' ],
	inputs: ['hotkey', 'actionTreshold'],
		
	initialize: function(options) {
		var context = options.context;
		this.patterns = context.get('patterns');
		this.actions = context.get('actions');
		this.actionsView = new window.gtd.Settings.ActionsView({
			'el' : this.$el.find('#actionsList'),
			'collection' : this.actions
		});
		
		this.patternsView = new window.gtd.Settings.PatternsView({
			'el' : this.$el.find('#patternsList'),
			'collection' : this.patterns
		});
		this.actionsView.render();
		this.patternsView.render();
		this.render();
		this.actionsView.on('render:finish', this._renderAdvanced, this);
		this.patternsView.on('render:finish', this._renderAdvanced, this);
		this.patternsView.on('edit:click', this._onPatternEdit, this);
		this.model.on('change:advancedMode', this._renderAdvanced, this);
	},
	
	render: function() {
		this._renderAdvanced();
		
		_.each(this.checkboxes, function(id) {
			var checked = this.model.get(id);
			this.$el.find('#'+id).prop('checked', checked);
		}, this);
		
		_.each(this.inputs, function(id) {
			var value = this.model.get(id);
			this.$el.find('#'+id).val(value);
		}, this);
		
	},
	
	_renderAdvanced: function() {
		if (this.model.get('advancedMode')) {
			this.$el.find('.advanced-mode').show();
		} else {
			this.$el.find('.advanced-mode').hide();
		}
		
		this.$el.find('input').blur();
	},
	
	_onCheckBoxChange: function(e) {
		var $chkbox = $(e.target);
		var id = $chkbox.attr('id');
		var checked = $chkbox.prop('checked');
		this.model.set(id, checked);
	},
	
	_onCloseClick: function(e) {
		window.close();
	},
	
	_onActionTresholdChange: function(e) {
		var $treshold = $(e.target);
		var val = $treshold.val();
		if (val >=0 && val <= 100) {
			this.model.set('actionTreshold', parseInt(val,10));
		}
	},
	
	_onHotkeyChange: function(e) {
		var $hotkey = $(e.target);
		var val = $hotkey.val();
		this.model.set('hotkey', val);
	},
	
	_onPatternAddClick: function(e) {
		this._onPatternEdit( new window.gtd.Pattern.Pattern(), true );
		e.preventDefault();
	},

	_onPatternEdit: function(pattern, addMode) {

		this.patternEditView = new window.gtd.Settings.PatternEditView({
			'el' : this.$el,
			'model' : pattern,
			'addMode' : addMode,
			'collection' : this.patterns
		});
		this.patternEditView.render();
	}
	
	
	
});