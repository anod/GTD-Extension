<?php
$loader = require_once 'vendor/autoload.php';

$protocol = new \Zend\Mail\Protocol\Imap();
$imap = new \GTD\Imap($protocol);
$oauth = new \GTD\OAuth($imap);

$imap->connect();
$result = $oauth->authenticate('alex.gavrishev@gmail.com', 'ya29.AHES6ZQTShloAmWaCsXDqySmV77I3_HTIXbt27owYe2ei1Mk');
if ($result) {
	echo "Authorized\n";
	$imap->getProtocol()->capability();
	$response = $imap->sendId();
	$result = $imap-> getProtocol()->select('INBOX');

	$search_response = $imap->getProtocol()->requestAndResponse('UID SEARCH', array('X-GM-MSGID', '1417471224887292232'));
	if ($search_response) {
		$msg_uid = $search_response[0][1];
		var_dump($msg_uid);
		
	}
}