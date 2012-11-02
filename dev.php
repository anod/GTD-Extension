<?php
$loader = require_once 'vendor/autoload.php';

$test_data = array(
	'email' => 'alex.gavrishev@gmail.com',
	'token' => 'ya29.AHES6ZSmkMK6x2mA1jnS3SMFbwtaPIRvdGPwUPeREjOePABf',
	'action' => 1,
	'msgid'	=> '1417537161044037294'
);

$c = new \GTD\Controller();
$response = $c->runUnsafe($test_data);

var_dump($response);