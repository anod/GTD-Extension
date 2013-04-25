#!/bin/bash

java -jar JsTestDriver-1.3.5.jar --tests all --testOutput report --config jsTestDriver-cli.conf
genhtml -o report/html/ report/jsTestDriver.conf-coverage.dat
