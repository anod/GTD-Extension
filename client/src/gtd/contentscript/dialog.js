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
		_.bindAll(this, '_onApplyClick', '_onDoItNowClick', '_onLaterClick' , '_labelChange', '_projectChange', '_contextChange', '_dateChange');
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
				{ addClass: 'btn btn-primary T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Apply', onClick: this._onApplyClick },
				{ addClass: 'btn btn-information T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Do it now', onClick: this._onDoItNowClick },
				{ addClass: 'btn btn-information T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Later', onClick: this._onLaterClick }
			]
		}));
		noty.$bar.css({ background: '#E7E7E7' });
		noty.$buttons.css({ 
			borderTop: '1px solid #ccc',
			backgroundColor: '#E7E7E7',
			textAlign: 'center'
		});
	},
	
	_onLaterClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	_onDoItNowClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	_onApplyClick: function(noty) {
		var s = this.model.get('suggestion');
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