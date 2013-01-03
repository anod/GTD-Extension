<?php
namespace GTD;
/**
 * 
 * @author alex
 *
 */
class Controller {
	const ACTION_LABEL = 1;
	private $email;
	private $token;
	private $action;
	private $msgid;
	/**
	 * 
	 * @var \GTD\Gmail
	 */
	private $gmail;
	private $debug;
	/**
	 * 
	 * @param bool $debug
	 */
	public function __construct($debug = false) {
		$this->debug = true;
	}
	
	public function run(array $request) {
		try {
			$reponse = $this->runUnsafe($request);
		} catch(\Exception $e) {
			return $this->errorResponse($e->getMessage());
		}
		return $response;
	}
	
	public function runUnsafe(array $request) {
		$this->initRequest($request);
		$this->initLibraries();
		
		$this->gmail->connect();
		$this->gmail->authenticate($this->email, $this->token);
		$this->gmail->sendId();
		$this->gmail->selectInbox();
		$uid = $this->gmail->getMessageUID($this->msgid);
		
		if ($this->action == self::ACTION_LABEL) {
			$label = isset($request['label']) ? trim($request['label']) : '';
			if (empty($label)) {
				throw new ControllerException("Request missing parameter: label");
			}
			$this->gmail->applyLabel($uid, $label);
		}
	}
	
	private function errorResponse($msg) {
		return array(
			'status' => 'error',
			'message' => $msg	
		);
	}

	private function goodResponse() {
		return array(
			'status' => 'ok'
		);
	}
	
	private function initLibraries() {
		$protocol = new Imap($this->debug);
		$this->gmail = new \GTD\Gmail($protocol);
	}
	
	private function initRequest(array $request) {
		if (!isset($request['email']) || !$request['email']) {
			throw new ControllerException("Request missing parameter: email");
		}
		if (!isset($request['token']) || !$request['token']) {
			throw new ControllerException("Request missing parameter: token");
		}
		if (!isset($request['action']) || !$request['action']) {
			throw new ControllerException("Request missing parameter: action");
		}
		if (!isset($request['msgid']) || !$request['msgid']) {
			throw new ControllerException("Request missing parameter: msgid");
		}
		$this->email = $request['email'];
		$this->token = $request['token'];
		$this->action = $request['action'];
		$this->msgid = $request['msgid'];
	}
}

class ControllerException extends \Exception {}