<?php
namespace GTD;

include_once 'GmailMock.php';
include_once 'ControllerMock.php';

/**
 * 
 * @author Alex Gavrishev <alex.gavrishev@gmail.com>
 */
class ControllerTest extends \PHPUnit_Framework_TestCase {
	
	/**
	 * @covers \GTD\Controller::initRequest
	 */
	public function testInitRequest() {
		$method = new \ReflectionMethod('\GTD\Controller', 'initRequest');
		$method->setAccessible(TRUE);

		$required = array('email', 'token', 'action', 'msgid');
		
		$request = array();
		$this->_testInitRequestException($request, $method);
		foreach ($required AS $arg) {
			$this->_testInitRequestException($request, $method);
			$request[$arg] = true;
		}
		
		//No exception
		$request['archive'] = true;
		$method->invoke(new Controller(), $request);
		
	}
	
	protected function _testInitRequestException(array $request, \ReflectionMethod $method) {
		$actual = false;
		try {
			$method->invoke(new Controller(), $request);
		} catch (ControllerException $e) {
			$actual = true;
		}
			
		$this->assertTrue($actual, "Must throw exception, Request:". print_r($request, true));
	}
	
	/**
	 * @covers \GTD\Controller::run
	 */
	public function testRun() {
		$controller1 = $this->getMock('\GTD\Controller', array('runUnsafe'));
		
		$controller1->expects($this->once())
			->method('runUnsafe')
			->will($this->throwException(new \Exception('Error')));
		
		$response1 = $controller1->run(array());
		$this->assertInstanceOf('\GTD\Response\ErrorResponse', $response1);
		
		$controller2 = $this->getMock('\GTD\Controller', array('runUnsafe'));
		
		$controller2->expects($this->once())
		->method('runUnsafe')
		->will($this->returnValue(new \GTD\Response\OkResponse()));
		
		$response2 = $controller2->run(array());
		$this->assertInstanceOf('\GTD\Response\OkResponse', $response2);
	}
	
	/**
	 * 
	 * @param string $method
	 * @param int $action
	 * @dataProvider providerRunUnsafe
	 */
	public function testRunUnsafe($method, $action) {
		
		$controller = new ControllerMock();
		$controller->setMethodReturn('initGmail', new GmailMock());
		$controller->setMethodReturn($method, new \GTD\Response\OkResponse());
		
		$response = null;
		
		$mustPass = ($action > -1);
		$pass = true;
		try {
			$response = $controller->runUnsafe(array('email' => true, 'token' => true, 'action' => $action, 'msgid' => true));
			$this->assertInstanceOf('\GTD\Response\OkResponse', $response);
		} catch (\Exception $e) {
			$pass = false;
		}
		$this->assertEquals($pass, $mustPass);
		
	}
	
	public function providerRunUnsafe() {
		return array(
			array('actionLabels', \GTD\Controller::ACTION_LABEL),
			array('actionContent', \GTD\Controller::ACTION_CONTENT),
			array('actionThreadLabels', \GTD\Controller::ACTION_THREAD_LABELS),
			array('actionDelete', \GTD\Controller::ACTION_DELETE),
			array('actionLabels', -1)
		);
	}
	
	public function testActionContent() {
		$message = new \Anod\Gmail\Message(array('id' => 5));
		
		$gmail = new GmailMock();
		$gmail->setMethodReturn('getMessageData', $message);
		
		$controller = new ControllerMock();
		$controller->setGmail($gmail);
		
		$response = $controller->actionContent(15);
		$this->assertEquals(new \GTD\Response\MessageResponse($message), $response);
	}
	
	public function testActionLabels() {
		
	}
	
}


