"use strict";

window.gtd.Contentscript.Dialog = Backbone.View.extend({
	notyPlugin: window.noty,
	notyOptions: {
		layout: 'bottomCenter',
		type: 'confirm',
		text: '',
		closeWith: ['button']
	},
	$label: null,
	$date: null,
	$dateLabel: null,
	$project: null,
	$context: null,
		
	initialize: function() {
		_.bindAll(this, '_onApplyClick', '_onDoItNowClick', '_onLaterClick' , '_labelChange', '_projectChange', '_contextChange', '_dateChange', '_onApplyArchiveClick');
	},
	
	closeAll: function() {
		$.noty.closeAll();
	},
	
	
	_init: function() {
		this.$el.html(this._template());
		this.$label = this.$el.find("select.noty_gtd_label");
		this.$date = this.$el.find("input[name=date]");
		this.$dateLabel = this.$el.find('#dateLabel');
		this.$context = this.$el.find("input[name=context]");
		this.$project = this.$el.find("input[name=project]");
		this.$date = this.$el.find("input[name=date]");

		this.$el.find('span#context-clear').click(_.bind(function() {
			this.$context.val('');
		},this));

		this.$el.find('span#project-clear').click(_.bind(function() {
			this.$project.val('');
		},this));
		
		this.$el.find('.noty_gtd_label').change(this._labelChange);
		this.$el.find('input[name=date]').change(this._dateChange);
		this.$el.find('input[name=context]').change(this._contextChange);
		this.$el.find('input[name=project]').change(this._projectChange);
		
		this.$date.datepicker({
			dateFormat: "yy-mm-dd",
			inline: true,  
			showOtherMonths: true
		});
	},
	
	highlight: function() {
		this.$el.effect("highlight", { color: '#fff' });
	},
	
	render: function() {
		this._init();
		this.$label.val(this.model.get('label'));
		this.$date.val(this.model.get('date'));
		this.$context.val(this.model.get('context'));
		this.$project.val(this.model.get('project'));
		this._setDateLabel();
		//Noty deletes properties
		var defaultOptions = _.clone(this.notyOptions);
		var noty = this.notyPlugin(_.extend(defaultOptions,{
			template: this.$el,
			buttons: [
				{ addClass: 'btn btn-primary', text: 'Do it now', onClick: this._onDoItNowClick },
				{ addClass: 'btn btn-primary', text: 'Apply & Leave', onClick: this._onApplyClick },
				{ addClass: 'btn btn-primary', text: 'Apply & Archive', onClick: this._onApplyArchiveClick }
			]
		}));
		noty.$bar.css({ 
			'backgroundColor': '#DCDCDC',
			'backgroundImage': '-webkit-linear-gradient(top,#DCDCDC,#f1f1f1)'
		});
		noty.$buttons.css({ 
			borderTop: '1px solid #ccc',
			textAlign: 'center',
			marginRight: '0'
		});
	},
	
	_onLaterClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	_onDoItNowClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	_onApplyClick: function(noty) {
		this._applyAction(false);
	},
	
	_onApplyArchiveClick: function(noty) {
		this._applyAction(true);
	},
	
	_applyAction: function(archive) {
		if (!this.model.get('insideEmail')) {
			return;
		}
		var msgId = this.model.get('openMsgId');
		var s = {
			id: msgId,
			action: {}
		};
		s.action.label    = this.model.get('label');
		if (this._isCalendarSelected()) {
			s.action.deadline = null;
			s.action.start_date = this.model.get('date');
		} else {
			s.action.deadline = this.model.get('date');
			s.action.start_date = null;
		}
		s.action.context  = this.model.get('context');
		s.action.project  = this.model.get('project');
		s.action.archive = archive;
		var message = {
			'action' : 'apply',
			'suggestion' : s
		};
		window.chrome.extension.sendMessage(message);
		this.model.set('showDialog', false);
	},
	
	_labelChange: function(e) {
		this.model.set('label', this.$label.val());
		this._setDateLabel();
	},
	
	_dateChange: function(e) {
		this.model.set('date', this.$date.val());
	},
	
	_contextChange: function(e) {
		this.model.set('context', this.$context.val());
	},
	
	_projectChange: function(e) {
		this.model.set('project', this.$project.val());
	},
	
	_isCalendarSelected: function() {
		return this.model.get('label') == 'GTD-Calendar';
	},
	
	_setDateLabel: function() {
		if (this._isCalendarSelected()) {
			this.$dateLabel.html('Date:');
		} else {
			this.$dateLabel.html('Deadline:');
		}
	},
	
	_template: function(suggestion) {
		var text = 'The email will be assigned to:';
		
		return '<div class="noty_message">' + 
		'<span class="noty_text"></span>' +
		'<div class="container">' +
			'<div class="span4">' +
			'<div class="row"> ' +
				'<div class="span4">' + text + '</div>' +
			'</div>' + 
			'<div class="row">'+ this._renderLabelSelect() + '</div>' +
			'<div class="row"> ' +
				'<div class="span2" id="dateLabel">Deadline:</div>' +
				'<div class="span2">Context:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<input class="span2" name="date" />' +
				'<div class="input-append">' + 
					'<input class="span2" name="context" placeholder="Context"/>' +
					'<span id="context-clear" class="clear">x</span>' +
				'</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="span4">Project name:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="input-append">' + 
					'<input class="span4" name="project" placeholder="Project Name"/>' +
					'<span id="project-clear" class="clear">x</span>' +
				'</div>' +
			'</div>' +
			'</div>' +
		'</div>' +
		'<div class="noty_close"></div></div>';
	},
	

	_renderLabelSelect: function() {
		var labelValues = [ 'GTD-NextAction', 'GTD-Project', 'GTD-WaitingFor', 'GTD-Calendar', 'GTD-Someday' ];
		var labelTitles = [ 'Next Action', 'Project', 'Waiting for', 'Calendar', 'Someday' ];
		var labelSelect = '<select class="noty_gtd_label span4">';
		for (var i=0; i<labelTitles.length; i++) {
			labelSelect+= '<option value="'+labelValues[i]+'">' + labelTitles[i] + '</option>';
		}
		labelSelect+='</select>';
		return labelSelect;
	}
});