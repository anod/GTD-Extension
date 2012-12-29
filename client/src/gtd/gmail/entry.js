"use strict";

window.gtd.Gmail.Entry = Backbone.Model.extend({

	defaults : {
		id : "",
		msgid: "",
		title : "",
		summary : "",
		author_name : "",
		author_email : ""
	}

});