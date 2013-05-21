"use strict";
/**
 * External API constants
 * @author alex
 */
window.gtd.External.Api = {
	URL: 'http://gtdproject.example.com:8082/GTD/CreateTaskFromEmail',
	//URL: 'http://gtd.anodsplace.info/extapi_recv.php',
	
	ACTION_LINK: 'http://gtdProject.example.com:8082/GTD/redirectToTaskOrProject.jsp?emailId=',
		
	Consts : {
		NEXT_ACTION_LABEL_ID: 1,
		WATING_ON_LABEL_ID: 2,
		DELAYED_LABEL_ID: 3,
		SOMEDAY_LABEL_ID: 4,
		PROJECT_LABEL_ID: 5,
		
		NO_PRIORITY: 0,
		HIGH_PRIORITY: 1,
		MEDIUM_PRIORITY: 2,
		LOW_PRIORITY: 3
	}


};