"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Utils.DateUtils", {

	testGetThisWeekend: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Tue Feb 26 2013'});
		var actual = dateutils.getThisWeekend();
		assertEquals('2013-03-01', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-08', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sat Mar 9 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-15', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sun Mar 10 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-15', actual);
	},

	
	testGetNextWeekend: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Tue Feb 26 2013'});
		var actual = dateutils.getNextWeekend();
		assertEquals('2013-03-08', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-15', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sat Mar 9 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-15', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sun Mar 10 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-22', actual);
	},
	
	testGetToday: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		var actual = dateutils.getToday();
		assertEquals('2013-03-07', actual);
	},
	
	testGetTomorrow: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		var actual = dateutils.getTomorrow();
		assertEquals('2013-03-08', actual);
	}
	
});