"use strict";

document.addEventListener('DOMContentLoaded', function () {

	var db = window.gtd.Db.init();
	var context = new window.gtd.Context({
		'$' : window.$,
		'localStorage' : window.localStorage,
		'db'       : db
	});

	var settings = new window.gtd.Settings.Settings({},{ 'context': context, 'localStorage' : window.localStorage });
	context.set({'settings' : settings});

	var patterns = new window.gtd.Pattern.PatternCollection([], { 'context': context });
	context.set({'patterns' : patterns});

	var actions = new window.gtd.Analysis.ActionCollection([], { 'context': context });
	context.set('actions', actions);

	new window.gtd.Settings.SettingsView({
		'el' : '#accent',
		'model' : settings
	});
	
	settings.set('firstTime' , false);
});