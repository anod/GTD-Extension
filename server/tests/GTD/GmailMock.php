<?php
namespace GTD;

class GmailMock extends \Anod\Gmail\Gmail {
	private $methodReturns = array();
	
	public function setMethodReturn($method, $return) {
		$this->methodReturns[$method] = $return;
	}
	
	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::__construct()
	*/
	public function __construct() {}
	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::connect()
	*/
	public function connect() {
		return true;
	}
	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::authenticate()
	*/
	public function authenticate($email, $accessToken) {
		return true;
	}
	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::sendId()
	*/
	public function sendId() {
		return true;
	}

	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::getUID()
	*/
	public function getUID($msgid) {
		return 25;
	}

	public function selectAllMail() {
		return true;
	}
	/* (non-PHPdoc)
	 * @see \Zend\Mail\Storage\AbstractStorage::__destruct()
	*/
	public function __destruct() {
	}
	
	/* (non-PHPdoc)
	 * @see \Anod\Gmail\Gmail::getMessageData()
	 */
	public function getMessageData($uid) {
		return $this->methodReturns[__FUNCTION__];
	}

}