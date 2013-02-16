<?php
$loader = require_once 'vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

date_default_timezone_set('Asia/Jerusalem');

// create a log channel
$log = new Logger(\GTD\ExtApi::NAME);
$log->pushHandler(new StreamHandler(__DIR__ . '/'. \GTD\ExtApi::PATH, Logger::INFO));

if ($_POST) {
	$data = var_export($_POST, true);
	$log->info($data);
	echo json_encode(array('status' => 'ok'));
}