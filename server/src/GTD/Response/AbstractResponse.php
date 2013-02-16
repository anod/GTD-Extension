<?php 
namespace GTD\Response;

abstract class AbstractResponse {
	const STATUS_OK = 'ok';
	const STATUS_ERROR = 'error';
	private $status;
	
	public function __construct($status) {
		$this->status = $status;
	}
	
	/**
	 * @return array
	 */
	abstract protected function jsonSerializeImpl();
	
	public function jsonSerialize() {
		$data = $this->jsonSerializeImpl();
		$data['status'] = $this->status;
		return $data;
	}
	
}