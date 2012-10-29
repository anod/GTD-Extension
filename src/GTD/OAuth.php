<?php
namespace GTD;

require_once 'Zend/Mail/Protocol/Imap.php';

class OAuth {
	/**
	 * @var Zend_Mail_Protocol_Imap
	 */
	private $imap;
	
	public function __construct() {
		$this->imap = new Zend_Mail_Protocol_Imap('imap.gmail.com', '993', true);
	}
	
	/**
	 * Builds an OAuth2 authentication string for the given email address and access
	 * token.
	 */
	private function constructAuthString($email, $accessToken) {
		return base64_encode("user=$email\1auth=Bearer $accessToken\1\1");
	}
	
	/**
	 * Given an open IMAP connection, attempts to authenticate with OAuth2.
	 *
	 * @param $imap is an open IMAP connection.
	 * @param $email is a Gmail address.
	 * @param $accessToken is a valid OAuth 2.0 access token for the given email address.
	 *
	 * @returns bool true on successful authentication, false otherwise.
	 */
	private function authenticate($imap, $email, $accessToken) {
		$authenticateParams = array('XOAUTH2', $this->constructAuthString($email, $accessToken));
		$imap->sendRequest('AUTHENTICATE', $authenticateParams);
		while (true) {
			$response = "";
			$is_plus = $imap->readLine($response, '+', true);
			if ($is_plus) {
				error_log("got an extra server challenge: $response");
				// Send empty client response.
				$imap->sendRequest('');
			} else {
				if (preg_match('/^NO /i', $response) || preg_match('/^BAD /i', $response)) {
					error_log("got failure response: $response");
					return false;
				} else if (preg_match("/^OK /i", $response)) {
					return true;
				} else {
					// Some untagged response, such as CAPABILITY
				}
			}
		}
	}

}
