<?php
namespace GTD;
/**
 * 
 * @author alex
 *
 */
class OAuth {
	const GMAIL_HOST = 'imap.gmail.com';
	const GMAIL_PORT = '993';
	const USE_SSL = true;
	/**
	 * @var Zend\Mail\Protocol\Imap
	 */
	private $imap;
	
	/**
	 * 
	 */
	public function __construct() {
		$this->imap = new \Zend\Mail\Protocol\Imap();
	}
	
	/**
	 * 
	 * @return \GTD\OAuth
	 */
	public function connect() {
		$this->imap->connect(self::GMAIL_HOST, self::GMAIL_PORT, self::USE_SSL);
		return $this;		
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
	public function authenticate($email, $accessToken) {
		$authenticateParams = array(
			'XOAUTH2', $this->constructAuthString($email, $accessToken)
		);
		$this->imap->sendRequest('AUTHENTICATE', $authenticateParams);
		while (true) {
			$response = "";
			$is_plus = $this->imap->readLine($response, '+', true);
			var_dump($response);
			if ($is_plus) {
				error_log("got an extra server challenge: ".base64_decode($response));
				// Send empty client response.
				$this->imap->sendRequest('');
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

	/**
	 * Builds an OAuth2 authentication string for the given email address and access
	 * token.
	 */
	private function constructAuthString($email, $accessToken) {
		return base64_encode("user=$email\1auth=Bearer $accessToken\1\1");
	}


}
