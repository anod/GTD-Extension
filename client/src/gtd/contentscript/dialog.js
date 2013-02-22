"use strict";

window.gtd = (window.gtd) ? window.gtd : {};
window.gtd.Contentscript = (window.gtd.Contentscript) ? window.gtd.Contentscript : {};
window.gtd.Contentscript.Dialog = Backbone.View.extend({
	notyPlugin: window.noty,
	notyOptions: {
		layout: 'bottomCenter',
		type: 'confirm',
		text: '',
		closeWith: ['button']
	},
	$label: null,
	$deadline: null,
	$project: null,
	$context: null,
	
	events: {
		"change .noty_gtd_label": "_labelChange",
		"change input[name=deadline]": "_deadlineChange",
		"change input[name=context]": "_contextChange",
		"change input[name=project]": "_projectChange"
	},
	
	initialize: function() {
		this.$el.append(this._template());
		this.$label = this.$el.find("select.noty_gtd_label");
		this.$deadline = this.$el.find("input[name=deadline]");
		this.$context = this.$el.find("input[name=context]");
		this.$project = this.$el.find("input[name=project]");
		this.$deadline.datepicker({dateFormat: "yy-mm-dd"});
	},
	
	closeAll: function() {
		$.noty.closeAll();
	},
	
	render: function() {
		this.$label.val(this.model.get('label'));
		this.$deadline.val(this.model.get('deadline'));
		this.$context.val(this.model.get('context'));
		this.$project.val(this.model.get('project'));
		
		var noty = this.notyPlugin(_.extend(this.notyOptions,{
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
		noty.close();
	},
	
	_onDoItNowClick: function(noty) {
		noty.close();
	},
	
	_onApplyClick: function(noty) {
		var s = this.model.get('suggestion');
		s.action.label    = this.model.get('label');
		s.action.deadline = this.model.get('deadline');
		s.action.context  = this.model.get('context');
		s.action.project  =this.model.get('project');
		var message = {
			'action' : 'apply',
			'suggestion' : s 
		};
		window.chrome.extension.sendMessage(message);
		noty.close(); 
	},
	
	_labelChange: function(e) {
		this.model.set('label', this.$label.val());
	},
	
	_deadlineChange: function(e) {
		this.model.set('deadline', this.$deadline.val());
	},
	
	_contextChange: function(e) {
		this.model.set('context', this.$context.val());
	},
	
	_projectChange: function(e) {
		this.model.set('project', this.$project.val());
	},
	
	_template: function(suggestion) {
		var text = 'The email will be assigned to:';
		
		return '<div class="noty_message">' + 
		'<span class="noty_text"></span>' +
		'<div class="container">' +
			'<div class="span3">' +
			'<div class="row"> ' +
				'<div class="span3">' + text + '</div>' +
			'</div>' + 
			'<div class="row">'+ this._renderLabelSelect() + '</div>' +
			'<div class="row"> ' +
				'<div class="span1">Deadline:</div>' +
				'<div class="span2">Context:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="span1"><input name="deadline" /></div>' +
				'<div class="span2"><input name="context" /></div>' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="span3">Project name:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="span3"><input name="project" /></div>' +
			'</div>' +
			'</div>' +
		'</div>' +
		'<div class="noty_close"></div></div>';
	},


	_renderLabelSelect: function() {
		var labelValues = [ 'GTD-NextAction', 'GTD-Project', 'GTD-WaitingFor', 'GTD-Calendar', 'GTD-Someday' ];
		var labelTitles = [ 'Next Action', 'Project', 'Waiting for', 'Calendar', 'Someday' ];
		var labelSelect = '<select class="noty_gtd_label span3">';
		for (var i=0; i<labelTitles.length; i++) {
			labelSelect+= '<option value="'+labelValues[i]+'">' + labelTitles[i] + '</option>';
		}
		labelSelect+='</select>';
		return labelSelect;
	}
});