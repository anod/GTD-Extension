<?php
$loader = require_once 'vendor/autoload.php';

$protocol = new \Zend\Mail\Protocol\Imap();
$imap = new \GTD\Imap($protocol);
$oauth = new \GTD\OAuth($imap);

$imap->connect();
$result = $oauth->authenticate('alex.gavrishev@gmail.com', 'ya29.AHES6ZQqNvwtzeRrn7vUlqdTJXDin2P7qQHH-YD9rmG03VpV');
if ($result) {
	echo "Authorized\n";
	$capatibility = $imap->getProtocol()->capability();
	echo implode(" ",$capatibility),"\n";
	$response = $imap->sendId();
	print_r($response);
	
	$response = $imap->getProtocol()->requestAndResponse('XLIST', array('""' ,  '"*"'), true);
	print_r($response);
	
	$response = $imap->getProtocol()->requestAndResponse('SEARCH', array('X-GM-RAW', '"has:attachment in:unread"'));
	var_dump($response);
	
	$response = $imap->getProtocol()->requestAndResponse('FETCH', array("2004:1417384860882812671" ,  "(X-GM-MSGID)"));
	var_dump($response);
}