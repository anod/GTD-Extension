<?php
$loader = require_once 'vendor/autoload.php';

$oauth = new GTD\OAuth();

$oauth->connect();
$result = $oauth->authenticate('alex.gavrishev@gmail.com', '1/ktEHiFOaYAOkLZwgEM89cj1xuYcdckdaLUzRxV6bsBo');
