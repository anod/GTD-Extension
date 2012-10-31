<?php
namespace GTD;
/**
 * 
 * @author alex
 *
 */
class Imap {
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
	 *
	 * @param \Zend\Mail\Protocol\Imap $imap
	 */
	public function __construct(\Zend\Mail\Protocol\Imap $protocol) {
		$this->protocol = $protocol;
	}
	
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
	 * @return \Zend\Mail\Protocol\Imap
	 */
	public function getProtocol() {
		return $this->protocol;
	}
	
	/**
	 *
	 * @return \GTD\Imap
	 */
	public function connect() {
		$this->protocol->connect(self::GMAIL_HOST, self::GMAIL_PORT, self::USE_SSL);
		return $this;
	}
}