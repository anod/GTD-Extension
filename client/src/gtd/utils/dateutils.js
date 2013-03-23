"use strict";

window.gtd.Utils.DateUtils = Backbone.Model.extend({
	
	defaults: {
		now: null
	},
	
	getThisWeekend: function() {
		var curr = this._getCurrentDate(); // get current date
		var today = curr.getDate();
		var weekendStart =  today - curr.getDay() + 5; // First day is the day of the month - the day of the week
		if (weekendStart <= today) {
			return this.getNextWeekend();
		}
		return this._dateToStr(new Date(curr.setDate(weekendStart)));
	},
	
	getNextWeekend: function() {
		var curr = this._getCurrentDate(); // get current date
		var weekendStart = curr.getDate() - curr.getDay() + 12; // First day is the day of the month - the day of the week
		return this._dateToStr(new Date(curr.setDate(weekendStart)));
	},
	
	getToday: function() {
		var curr = this._getCurrentDate(); // get current date
		return this._dateToStr(curr);
	},
	
	getTomorrow: function() {
		var curr = this._getCurrentDate(); // get current date
		curr.setDate(curr.getDate()+1);
		return this._dateToStr(curr);
	},
	
	_dateToStr: function(date) {
		var month = (date.getMonth() + 1);
		var day = date.getDate();
		var monthStr = (month < 10) ? '0'+month : month;
		var dayStr = (day < 10) ? '0'+day : day;
		return date.getFullYear() + '-' + monthStr + '-' + dayStr;
	},
	
	
	_getCurrentDate: function() {
		return (this.get('now')) ? new Date(this.get('now')) : new Date();
	}
});