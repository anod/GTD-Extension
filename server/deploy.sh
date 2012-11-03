#!/bin/bash

## https://github.com/resmo/git-ftp
##
## Init: 
##   ftp init -u monos108 -p - ftp://anodsplace.info/gtd --syncroot server
##
## Set scope:
##   git config git-ftp.gtd.url ftp://anodsplace.info/gtd
##   git config git-ftp.gtd.user monos108
##   git config git-ftp.gtd.password <PASWORD>
##   git config git-ftp.gtd.syncroot server
##
git ftp push -s gtd
