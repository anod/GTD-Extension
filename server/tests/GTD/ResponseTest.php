<?php
namespace GTD;

include_once 'ImapMock.php';
include_once 'GmailMock.php';
include_once 'ControllerMock.php';

/**
 * 
 * @author Alex Gavrishev <alex.gavrishev@gmail.com>
 */
class ResponseTest extends \PHPUnit_Framework_TestCase {
	
	/**
	 * @covers \GTD\Response\OkResponse
	 */
	public function testOk() {
		$response = new \GTD\Response\OkResponse();
		$this->assertEquals(array('status'=>'ok'),$response->jsonSerialize());
	}
	
	/**
	 * @covers \GTD\Response\ArrayResponse
	 */
	public function testArray() {
		$response = new \GTD\Response\ArrayResponse(array('hello'=>'world'));
		$this->assertEquals(array('status'=>'ok','hello'=>'world'),$response->jsonSerialize());
	}

	/**
	 * @covers \GTD\Response\ErrorResponse
	 */
	public function testError() {
		$response = new \GTD\Response\ErrorResponse('message111');
		$this->assertEquals(array('status'=>'error', 'message' => 'message111'),$response->jsonSerialize());
	}
	
	/**
	 * @covers \GTD\Response\MessageResponse
	 */
	public function testMessageRespons() {
		$message = new \Anod\Gmail\Message(array(
			'content' => 'lalala',
			'headers' => array('subject' => 'hello!', 'from' => 'me', 'to' => 'him', 'x-gm-thrid ' => 0)
		));
		$response = new \GTD\Response\MessageResponse($message);
		$expected = array(
			'status'=>'ok',
			'subject' => 'hello!',
			'body' => 'lalala',
			'from' => 'me',
			'to' => 'him',
			'thrid' => 0
		);
		$this->assertEquals($expected,$response->jsonSerialize());
	}
}