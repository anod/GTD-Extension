<?php
$loader = require_once 'vendor/autoload.php';

$c = new \GTD\Controller();
$response = $c->run($_POST);

echo json_encode($response);