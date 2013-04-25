<?php
namespace GTD;

class ImapMock extends \Zend\Mail\Protocol\Imap 
{
	
	/* (non-PHPdoc)
	 * @see \Zend\Mail\Protocol\Imap::create()
	 */
	public function create($folder) {
		return true;
	}

}