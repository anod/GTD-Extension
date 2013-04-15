<?php
namespace GTD;

/**
 * 
 * 
 * @author Alex Gavrishev <alex.gavrishev@gmail.com>
 *
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
}
