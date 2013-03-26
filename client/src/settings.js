"use strict";

document.addEventListener('DOMContentLoaded', function () {

	var db = window.gtd.Db.init();
	var settings = new window.gtd.Settings.Settings({},{ 'db': db, 'localStorage' : window.localStorage });

	
	new window.gtd.Settings.SettingsView({
		'el' : '#accent',
		'model' : settings
	});
});
