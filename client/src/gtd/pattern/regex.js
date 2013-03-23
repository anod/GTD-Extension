"use strict";

window.gtd.Pattern.Regex = {
	/**
	 * dd/MM/YY
	 * dd/MM/YYYY
	 * dd-MM-YY
	 * dd-MM-YYYY
	 * dd/MM
	 * this weekend
	 * next weekend
	 * weekend
	 * today
	 * tomorrow
	 * next week
	 * next month
	 * h
	 */
	DATE: '(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{1,2}-\\d{1,2}-\\d{2,4}|\\d{1,2}\\/\\d{1,2}|\\bthis\\s+weekend|\\bnext\\s+weekend|\\bweekend|\\btoday|\\btomorrow|\\bnext\\s+week|\\bnext\\s+month|\\d{1,2}[ap]\\.?m\\.?)',
	PROJECT_NAME: '(\\bproject\\s+[^\\s]+)',
	ACTION: '(\\next\\s+action|\bproject|\\bwaiting\\s*for|\\bcalendar|\\bsomeday)',
	CONTEXT: '(\\bcontext\\s+[^\\s]+|youtube\\.com)'
};