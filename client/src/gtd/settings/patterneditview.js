"use strict";

window.gtd.Settings.PatternEditView = Backbone.View.extend({
	types: {
		2: "Apply Action",
		4: "Context",
		1: "Project Name",
		3: "Skip Action"
	},
	
	$modal: null,
	
	render: function() {
		this.$el.find('#pattern-edit').remove();
		this.$modal = $(this._template(this.model));
		this.$el.add(this.$modal);
		this.$modal.show();
	},
	
	_close: function() {
		this.$modal.remove();
	},
	
	_template: function(pattern) {
		var type = pattern.get('type');
		var action = pattern.get('action');
		var html = '<div id="pattern-edit" class="modal-overlay"><div>' +
			'<div class="p holo-spinner">' +
				this._renderSelect(this.types, type, 'type', { value: -1, name: 'Select type'}) +
			'</div>' +
			'<div class="p holo-spinner">' +
				this._renderSelect(window.gtd.Label, action, 'action', { value: '', name: ''}) +
			'</div>' +
			'<div class="holo-field">' +
				'<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="from" placeholder="From:" value="'+pattern.escape('from')+'" />' +
				'</div>' +
			'</div>' +
			'<div class="holo-field">' +
			'	<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="content" placeholder="Content:" value="'+pattern.escape('content')+'" />' +
				'</div>' +
			'</div>' +
			'<div class="holo-field">' +
			'	<div class="holo-field-bracket"></div>' + 
					'<input type="text" name="value" placeholder="Value:" value="'+pattern.escape('value')+'" />' +
				'</div>' +
			'</div>' +
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
	}
	
});