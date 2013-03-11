<?php
$loader = require_once 'vendor/autoload.php';

$c = new \GTD\Controller();
$response = $c->run($_REQUEST);

echo json_encode($response->jsonSerialize());