<?php
$loader = require_once 'vendor/autoload.php';

$tail = new PHPTail(__DIR__ . '/'. \GTD\ExtApi::PATH);

/**
 * We're getting an AJAX call
 */
if(isset($_GET['ajax']))  {
	echo $tail->getNewLines($_GET['lastsize'], $_GET['grep'], $_GET['invert']);
	exit();
}
/**
 * Regular GET/POST call, print out the GUI
 */
$tail->generateGUI();