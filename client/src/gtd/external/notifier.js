"use strict";

window.gtd.External.Notifier = Backbone.Model.extend({
	_labelsMap: null,
	defaults : {
		'$' : window.$,
		'oauth' : window.oauth,
		'context' : null,
		'imap' : null
	},
	
	initialize: function() {
		this.get('context').on('analysis:apply:action', this._notifyAction, this);
		this._labelsMap = this._initLabelsMap();
	},

	_notifyAction: function(emailId, action) {
		this.get('imap').getContent(emailId, _.bind(function(data) {
			var params = this._createRequest(emailId, data, action);
			this._sendRequest(params);
		},this));
	},
	
	_createRequest: function(emailId, email, action) {
		
		var labelId = this._labelsMap[action.get('label')];
		var start_date = '';
		var deadline = '';
		if (labelId == window.gtd.External.Api.Consts.DELAYED_LABEL_ID) {
			start_date = action.get('date');
		} else {
			deadline = action.get('date');		
		}
		
		var params = {
			'user_id' : this.get('context').get('userinfo').get('email'),
			'sender_address' : email.from,
			'mail_id' : emailId,
			'subject' : email.subject,
			'content' : email.body,
			'thread_id' : email.thrid,
			'label' : labelId,
			'project': action.get('project'),
			'context': action.get('context'),
			'deadline': deadline,
			'start_date': start_date,
			'priority' : window.gtd.External.Api.Consts.NO_PRIORITY
		};
		
		var data = {
			'jsonMsg' : JSON.stringify(params)
		};

		return data;
	},
	
	_initLabelsMap: function() {
		var labels = {};
		labels[window.gtd.Label.NEXT_ACTION] = window.gtd.External.Api.Consts.NEXT_ACTION_LABEL_ID;
		labels[window.gtd.Label.WAITINGFOR] = window.gtd.External.Api.Consts.WATING_ON_LABEL_ID;
		labels[window.gtd.Label.CALENDAR] = window.gtd.External.Api.Consts.DELAYED_LABEL_ID;
		labels[window.gtd.Label.SOMEDAY] = window.gtd.External.Api.Consts.SOMEDAY_LABEL_ID;
		labels[window.gtd.Label.PROJECT] = window.gtd.External.Api.Consts.PROJECT_LABEL_ID;
		
		return labels;
	},
	
	_sendRequest: function(params, callback) {
		var data = params || {};
		var self = this;
		var url = window.gtd.External.Api.URL;
		this.get('$').post(url, data, function(response){
			console.log(response);
		});
	}

});