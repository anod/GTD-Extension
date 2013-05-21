"use strict";
/**
 * Message action dialog view
 * @author alex
 */
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
		
	/**
	 * @override
	 */
	initialize: function() {
		_.bindAll(this, '_onApplyClick', '_onDoItNowClick', '_onLaterClick' , '_labelChange', '_projectChange', '_contextChange', '_dateChange', '_onApplyArchiveClick');
	},
	
	/**
	 * Close dialog
	 */
	closeAll: function() {
		$.noty.closeAll();
	},
	
	/**
	 * Create html from template
	 * @acces private
	 */
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
	
	/**
	 * Highlight opened dialog
	 */
	highlight: function() {
		this.$el.effect("highlight", { color: '#fff' });
	},
	
	/**
	 * Renders dialog on the screen
	 */
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
				{ addClass: 'btn btn-primary', text: 'Apply & Leave', onClick: this._onApplyClick },
				{ addClass: 'btn btn-primary', text: 'Apply & Archive', onClick: this._onApplyArchiveClick },
				{ addClass: 'btn btn-primary', text: 'Close', onClick: this._onDoItNowClick }
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
	
	/**
	 * Button callback
	 * @access private
	 * @param {window.noty} noty
	 */
	_onLaterClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	/**
	 * Button callback
	 * @access private
	 * @param {window.noty} noty
	 */
	_onDoItNowClick: function(noty) {
		this.model.set('showDialog', false);
	},
	
	/**
	 * Button callback
	 * @access private
	 * @param {window.noty} noty
	 */
	_onApplyClick: function(noty) {
		this._applyAction(false);
	},
	
	/**
	 * Button callback
	 * @access private
	 * @param {window.noty} noty
	 */
	_onApplyArchiveClick: function(noty) {
		this._applyAction(true);
	},
	
	/**
	 * Create action from filled data
	 * @access private
	 * @param {Bollean} archive
	 */
	_applyAction: function(archive) {
		if (!this.model.get('insideEmail')) {
			return;
		}
		var msgId = this.model.get('openMsgId');
		var s = {
			id: msgId,
			action: {}
		};
		s.action.label = this.model.get('label');
		s.action.date = this.model.get('date');
		s.action.context  = this.model.get('context');
		s.action.project  = this.model.get('project');
		s.action.archive = archive;
		s.action.tags = this.model.get('tags');
		var message = {
			'action' : 'apply',
			'suggestion' : s
		};
		window.chrome.extension.sendMessage(message);
		this.model.set('showDialog', false);
	},
	
	/**
	 * Change of action label event
	 * @access private
	 * @param e
	 */
	_labelChange: function(e) {
		this.model.set('label', this.$label.val());
		this._setDateLabel();
	},
	
	/**
	 * Change of the date
	 * @access private
	 * @param e
	 */
	_dateChange: function(e) {
		this.model.set('date', this.$date.val());
	},
	
	/**
	 * Change of the context
	 * @access private
	 * @param e
	 */
	_contextChange: function(e) {
		this.model.set('context', this.$context.val());
	},
	
	/**
	 * Change of the project
	 * @param e
	 */
	_projectChange: function(e) {
		this.model.set('project', this.$project.val());
	},
	
	/**
	 * Checks if current action is Calendar
	 * @access private
	 * @returns {Boolean}
	 */
	_isCalendarSelected: function() {
		return this.model.get('label') == 'GTD-Calendar';
	},
	
	/**
	 * Switch date label
	 * @access private
	 */
	_setDateLabel: function() {
		if (this._isCalendarSelected()) {
			this.$dateLabel.html('Date:');
		} else {
			this.$dateLabel.html('Date:');
		}
	},
	
	/**
	 * Html template
	 * @access private
	 * @param suggestion
	 * @returns {String}
	 */
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
				'<div class="span2" id="dateLabel">Date:</div>' +
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
	
	/**
	 * Create selectbox html
	 * @access private
	 * @returns {String}
	 */
	_renderLabelSelect: function() {
		var labelValues = [ 
			window.gtd.Label.NEXT_ACTION,
			window.gtd.Label.PROJECT,
			window.gtd.Label.WAITINGFOR,
			window.gtd.Label.CALENDAR,
			window.gtd.Label.SOMEDAY
		];
		var labelTitles = [ 'Next Action', 'Project', 'Waiting for', 'Calendar', 'Someday' ];
		var labelSelect = '<select class="noty_gtd_label span4">';
		for (var i=0; i<labelTitles.length; i++) {
			labelSelect+= '<option value="'+labelValues[i]+'">' + labelTitles[i] + '</option>';
		}
		labelSelect+='</select>';
		return labelSelect;
	}
});