"use strict";

window.gtd.Gmail.NewList = Backbone.Collection.extend({
	model: window.gtd.Gmail.Entry,

	oauth: null,
	feedUrl : 'https://mail.google.com/mail/feed/atom',
	instanceId : 'gmc' + parseInt(Date.now() * Math.random(), 10),

	initialize: function(models, options) {
		this.oauth = options.oauth;
		_.bind(this.feedResponse, this);
	},
	
	loadNewEmails: function() {
		var self = this;
		var request = {
			type : 'GET',
			url : this.feedUrl,
			data : {
				zx : this.instanceId
			},
			dataType : 'xml',
			headers : {
				'Authorization': 'OAuth ' + this.oauth.getAccessToken()
			},
			success : function(data, status, xhr) {
				self.feedResponse(data,xhr);
			},
			error : function(xhr, errorType, error) {
				console.log('Error load new emails: ' + errorType + ', ' + error);
			}
		};
		
		$.ajax(request);
	},
	
	feedResponse: function(xmlDoc, xhr) {
		var $xml = $(xmlDoc);
		var $entries = $xml.find("entry");
		var models = [];
		$.each($entries, function(key, value) {
			var $entry = $(this);
			var idArr = $entry.find("id").text().split(':');
			//<id>tag:gmail.google.com,2004:1417537161044037294</id>
			
			var $author = $entry.find("author");
			models.push({
				id: idArr[2],
				title:  $entry.find("title").text(),
				summary: $entry.find("summary").text(),
				author_name: $author.find("name").text(),
				author_email: $author.find("email").text()
			});
		});
		this.reset(models, {silent: true});
		this.trigger("gmail:newlist",this);
	}

});
