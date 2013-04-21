"use strict";

window.gtd.Settings.PatternEditView = Backbone.View.extend({
	types: {
		2: "Apply Action",
		4: "Context",
		1: "Project Name",
		3: "Skip Action"
	},
	
	events: {
		'click #pattern-cancel' : '_onCancelClick'
	},
	
	$modal: null,
	addMode: false,
	
	initialize: function(options) {
		this.addMode = options.addMode;
	},
	
	render: function() {
		this.$el.find('#pattern-edit').remove();
		this.$modal = $(this._template(this.model));
		this.$modal.appendTo(this.$el);
	},
	
	_close: function() {
		this.$modal.remove();
	},
	
	_template: function(pattern) {
		var type = pattern.get('type');
		var action = pattern.get('action');
		var title = (this.addMode) ? "Add Pattern" : "Edit Pattern";
		var saveTitle = (this.addMode) ? "Add" : "Save";
		
		var html = '<div id="pattern-edit" class="modal-overlay holo holo-light holo-accent-blue">' +
			'<div class="holo-action-bar"><h1>' + title + '</h1></div>' +
			'<div class="holo-content">' +
				'<div class="p holo-spinner">' +
					this._renderSelect(this.types, type, 'type', { value: -1, name: 'Select type'}) +
				'</div>' +
				'<div class="p holo-spinner">' +
					this._renderSelect(window.gtd.Label, action, 'action', { value: '', name: 'Select action (Optional)'}) +
				'</div>' +
				'<div class="holo-field">' +
					'<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="from" placeholder="From (Optional):" value="'+pattern.escape('from')+'" />' +
				'</div>' +
				'<div class="holo-field">' +
				'	<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="content" placeholder="Content (Optional):" value="'+pattern.escape('content')+'" />' +
				'</div>' +
				'<div class="holo-field">' +
				'	<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="value" placeholder="Value (Optional):" value="'+pattern.escape('value')+'" />' +
				'</div>' +
				'<div class="holo-buttons gtd-close"><button id="pattern-cancel" class="holo-button">Cancel</button></div>' + 
				'<div class="holo-buttons gtd-close" style="margin-right: 130px"><button id="pattern-save" class="holo-button">' + saveTitle + '</button></div>' + 
			'</div></div>'
		;
		
		return html;
	},
	
	_renderSelect: function(options, selected, name, firstOpt) {
		var optHtml = (firstOpt) ? '<option value="'+firstOpt.value+'">'+firstOpt.name+'</option>' : '';
		_.each(options, function(value, key) {
			var selected = (key == selected) ? 'selected="selected"' : '';
			optHtml+='<option value="'+key+'">'+value+'</option>';
		});
		return '<select name="'+name+'">' + optHtml + '</select>';
	},
	
	_onCancelClick: function(e) {
		this._close();
		e.preventDefault();
	}
	
});