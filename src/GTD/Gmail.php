<?php
namespace GTD;
/**
 * 
 * @author alex
 *
 */
class Gmail {
	const GMAIL_HOST = 'imap.gmail.com';
	const GMAIL_PORT = '993';
	const USE_SSL = true;

	private static $id = array(
		"name" , "GTD Chrome Extension",
		"version" , "0.1",
		"vendor" , "Alex Gavrishev",
		"contact" , "alex.gavrishev@gmail.com"
	);
	/**
	 * @var Zend\Mail\Protocol\Imap
	 */
	private $protocol;
	/**
	 * @var OAuth
	 */
	private $oauth;
	/**
	 * @var bool
	 */
	private $debug = false;
	/**
	 *
	 * @param \Zend\Mail\Protocol\Imap $imap
	 */
	public function __construct(\Zend\Mail\Protocol\Imap $protocol) {
		$this->protocol = $protocol;
		$this->oauth = new OAuth($protocol);
	}
	/**
	 * @param bool $debug
	 */
	public function setDebug($debug) {
		$this->debug = (bool)$debug;
	}
	/**
	 * @return void
	 */	
	public function sendId() {
		$escaped = array();
		foreach(self::$id AS $value) {
			$escaped[] = $this->protocol->escapeString($value);
		}
		return $this->protocol->requestAndResponse('ID', array(
			$this->protocol->escapeList($escaped))
		);
	}
	
	/**
	 * 
	 * @param string $email
	 * @param string $accessToken
	 */
	public function authenticate($email, $accessToken) {
		$this->oauth->authenticate($email, $accessToken);
	}
	
	/**
	 * 
	 * @return \Zend\Mail\Protocol\Imap
	 */
	public function getProtocol() {
		return $this->protocol;
	}
	
	/**
	 *
	 * @return \GTD\Gmail
	 */
	public function connect() {
		$this->protocol->connect(self::GMAIL_HOST, self::GMAIL_PORT, self::USE_SSL);
		return $this;
	}

	/**
	 * 
	 * @throws GmailException
	 * @return \GTD\Gmail
	 */
	public function selectInbox() {
		$result = $this->protocol->select('INBOX');
		if (!$result) {
			throw new GmailException("Cannot select INBOX");
		}
		return $this;
	}
	
	/**
	 * @return int
	 */
	public function getMessageUID($msgid) {
		$search_response = $this->protocol->requestAndResponse('UID SEARCH', array('X-GM-MSGID', $msgid));
		if (isset($search_response[0][1])) {
			return (int)$search_response[0][1];
		}
		throw new GmailException("Cannot retreieve message uid. ".var_export($search_response, TRUE));
	}

	/**
	 * @param string $uid
	 * @param string $label
	 */	
	public function applyLabel($uid, $label) {
		$response = $this->protocol->requestAndResponse('UID STORE', array($uid, '+X-GM-LABELS', '('.$label.')'));
		var_dump($response);
	} 
}

class GmailException extends \Exception {};