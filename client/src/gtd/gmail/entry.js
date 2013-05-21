"use strict";
/**
 * Class describes Gmail email entry
 * @author alex
 */
window.gtd.Gmail.Entry = Backbone.Model.extend({

	defaults : {
		msgid: "",
		title : "",
		summary : "",
		author_name : "",
		author_email : ""
	}

});