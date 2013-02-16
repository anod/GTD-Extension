"use strict";

window.gtd = (window.gtd) ? window.gtd : {};
window.gtd.contentscript = (window.gtd.contentscript) ? window.gtd.contentscript : {};
window.gtd.contentscript.GmailInbox = {
	noty: window.noty,
	run: function() {
		window.chrome.extension.onMessage.addListener(this._message);
		$(window).on('hashchange', this._checkUrl);
		this._checkUrl();
	},

	_checkUrl: function() {
		var self = window.gtd.contentscript.GmailInbox;
		var hash = document.location.hash;
		if (!hash) {
			self._closeAll();
			return false;
		}
		if (hash.length < 2) {
			self._closeAll();
			return false;
		}
		// Detects #inbox/13bc733d5810f7ee in hash and extracts message id
		var match = hash.match(/\/([0-9a-f]+)$/);
		if (!match || match.length < 2) {
			self._closeAll();
			return false;
		}
		var msgId = match[1];
		var message = {
			'action' : 'open',
			'msgId' : msgId 
		};
		window.chrome.extension.sendMessage(message);
		return true;
	},
	
	_response: function(resp) {
		console.log(resp);
	},
	
	_message: function(message, sender) {
		var self = window.gtd.contentscript.GmailInbox;
		if (message && message.action == 'show') {
			self._showDialog(message.suggestion);
		}
	},
	
	_showDialog: function(suggestion) {
		var n = window.gtd.contentscript.GmailInbox.noty({
			layout: 'bottomCenter',
			type: 'confirm',
			text: '',
			closeWith: ['button'],
			template: this._template(suggestion),
			buttons: [
			{ addClass: 'btn btn-information T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Do it now', onClick: function(noty){ noty.close(); } },
			{ addClass: 'btn btn-information T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Decide Later', onClick: function(noty){ noty.close(); }},
			{ addClass: 'btn btn-primary T-I J-J5-Ji Bq nS T-I-ax7 L3', text: 'Apply', onClick: function(noty){
				var s = noty.data;
				var label = noty.$bar.find(".noty_gtd_label").val();
				s.action.label = label;
				var message = {
						'action' : 'apply',
						'suggestion' : s 
				};
				window.chrome.extension.sendMessage(message);
				noty.close(); 
			}}
			]
		});
		n.data = suggestion;
		n.$bar.css({ background: '#E7E7E7' });
		n.$buttons.css({ 
			borderTop: '1px solid #ccc',
			backgroundColor: '#E7E7E7' 
		});
	},
	
	_closeAll: function() {
		$.noty.closeAll();
	},
	
	_template: function(suggestion) {
		var text = 'The email will be assigned to:';
		var labelSelect = this._renderLabelSelect();
		
		return '<div class="noty_message">' + 
		'<span class="noty_text"></span>' +
		'<div class="container">' +
			'<div class="span3">' +
			'<div class="row"> ' +
				'<div class="span3">' + text + '</div>' +
			'</div>' + 
			'<div class="row"> ' +
				labelSelect + 
			'</div>' +
			'<div class="row"> ' +
				'<div class="span1">Deadline:</div>' +
				'<div class="span2">Context:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<input class="span1" name="deadline" value="5 Jan" />' +
				'<input class="span2" name="context" value="Study" />' +
			'</div>' +
			'<div class="row"> ' +
				'<div class="span3">Project name:</div>' +
			'</div>' +
			'<div class="row"> ' +
				'<input class="span3" name="project name" value="GTD" />' +
			'</div>' +
			'</div>' +
		'</div>' +
		'<div>[' + suggestion.action.tags.join(', ') + ']</div>' +
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
};

$(document).ready(function() {
	window.gtd.contentscript.GmailInbox.run();
});

