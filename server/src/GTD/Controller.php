<?php
namespace GTD;
use GTD\Response\MessageResponse;
use GTD\Response\OkResponse;
use GTD\Response\AbstractResponse;
use GTD\Response\ErrorResponse;

/**
 * 
 * @author alex
 *
 */
class Controller {
	const ACTION_LABEL = 1;
	const ACTION_CONTENT = 2;
	
	private $email;
	private $token;
	private $action;
	private $msgid;
	/**
	 * 
	 * @var \GTD\Gmail
	 */
	private $gmail;
	private $debug = false;
	
	public function __construct() {
	}
	
	/**
	 * 
	 * @param array $request
	 * @return \GTD\Response\AbstractResponse
	 */
	public function run(array $request) {
		try {
			$response = $this->runUnsafe($request);
		} catch(\Exception $e) {
			return new ErrorResponse($e->getMessage());
		}
		return $response;
	}
	
	/**
	 * 
	 * @param array $request
	 * @throws ControllerException
	 * @return \GTD\Response\AbstractResponse
	 */
	public function runUnsafe(array $request) {
		$this->initRequest($request);
		$this->initLibraries();
		
		$this->gmail->connect();
		$this->gmail->authenticate($this->email, $this->token);
		$this->gmail->sendId();
		$this->gmail->selectInbox();
		$uid = $this->gmail->getUID($this->msgid);
		
		if ($this->action == self::ACTION_LABEL) {
			$label = isset($request['label']) ? trim($request['label']) : '';
			if (empty($label)) {
				throw new ControllerException("Request missing parameter: label");
			}
			$this->gmail->applyLabel($uid, $label);
			return new OkResponse();
		} elseif ($this->action == self::ACTION_CONTENT) {
			$message = $this->gmail->getMessageUID($uid);
			return new MessageResponse($message);
		}
		throw new ControllerException("Unknown action: '".$this->action."'");
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
		$this->msgid = hexdec($request['msgid']);
		$this->debug = isset($request['debug']) ? (bool)$request['debug'] : false;
	}
}

class ControllerException extends \Exception {}