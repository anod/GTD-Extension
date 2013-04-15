#!/bin/bash

vendor/bin/phpunit -c tests/phpunit.xml --coverage-html ./report tests/
