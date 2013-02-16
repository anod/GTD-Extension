<?php
$loader = require_once 'vendor/autoload.php';

header("Content-type: text/plain");

echo file_get_contents(__DIR__ . '/'. \GTD\ExtApi::PATH);
