<?php
namespace GTD;
use GTD\Response\ArrayResponse;

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
	const ACTION_THREAD_LABELS = 3;
	
	private $email;
	private $token;
	private $action;
	private $msgid;
	/**
	 * 
	 * @var \Anod\Gmail\Gmail
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
		$this->gmail->selectAllMail();
		$uid = $this->gmail->getUID($this->msgid);
		
		if ($this->action == self::ACTION_LABEL) {
			return $this->actionLabels($uid, $request);
		} elseif ($this->action == self::ACTION_CONTENT) {
			return $this->actionContent($uid);
		} elseif ($this->action == self::ACTION_THREAD_LABELS) {
			return $this->actionThreadLabels($uid);
		}
		throw new ControllerException("Unknown action: '".$this->action."'");
	}
	
	private function initLibraries() {
		$protocol = new \Anod\Gmail\Imap($this->debug);
		$this->gmail = new \Anod\Gmail\Gmail($protocol);
		$this->gmail->setId("GTD Gmail Extension","0.1","Alex Gavrishev","alex.gavrishev@gmail.com");
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
		$this->archive = isset($request['archive']) ? $request['archive'] : false;
		$this->msgid = \Anod\Gmail\Math::bchexdec($request['msgid']);
		$this->debug = isset($request['debug']) ? (bool)$request['debug'] : false;
	}
	
	/**
	 * 
	 * @param string $uid
	 * @return \GTD\Response\MessageResponse
	 */
	private function actionContent($uid) {
		$message = $this->gmail->getMessageData($uid);
		return new MessageResponse($message);
	}
	
	/**
	 * 
	 * @param string $uid
	 * @throws ControllerException
	 * @return \GTD\Response\OkResponse
	 */
	private function actionLabels($uid, array $request) {
		$labels = isset($request['labels']) && is_array($request['labels']) ? $request['labels'] : array();
		if (!$labels) {
			throw new ControllerException("Request missing parameter: labels");
		}
		//TODO extract to separate action
		$this->gmail->createFolder('GTD');
		$currentLabels = $this->gmail->getLabels($uid);
		$removeLabels = $this->getGtdLabels($uid);
		if ($removeLabels) {
			$this->gmail->removeLabels($uid, $removeLabels);
		}
		$this->gmail->applyLabels($uid, $labels);
		if ($this->archive) {
			$this->gmail->archive($uid);
		}
		return new OkResponse();
	}
	
	/**
	 * 
	 * @param string $uid
	 * @return \GTD\Response\ArrayResponse
	 */
	private function actionThreadLabels($uid) {
		$thrId = $this->gmail->getThreadId($uid);
		$initialUid = $this->gmail->getUID($thrId);
		$labels = $this->getGtdLabels($initialUid);
		return new ArrayResponse(array(
			'thrid' => \Anod\Gmail\Math::bcdechex($thrId),
			'labels' => $labels
		));
	}
	
	/**
	 * 
	 * @param string $uid
	 * @return array
	 */
	private function getGtdLabels($uid) {
		$allLabels = $this->gmail->getLabels($uid);
		$gtdLabels = array();
		foreach($allLabels AS $label) {
			if (strpos($label,'GTD%2F') === 0) {
				$gtdLabels[] = $label;
			}
		}
		return $gtdLabels;
	}
	
}

class ControllerException extends \Exception {}