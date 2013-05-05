#!/bin/bash

## https://github.com/resmo/git-ftp
##
## Init:
##   git ftp init -u alex -p - ftp://anodsplace-do//www/anodsplace.info/gtd --syncroot server -v
##
## Set scope:
##   git config git-ftp.gtd.url ftp://anodsplace-do/www/anodsplace.info/gtd
##   git config git-ftp.gtd.user alex
##   git config git-ftp.gtd.password <PASWORD>
##   git config git-ftp.gtd.syncroot server
##
git ftp push -s gtd
