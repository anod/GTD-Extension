<?php 
namespace GTD\Response;

class ArrayResponse extends AbstractResponse{
	/**
	 * @var array
	 */
	private $data;
	
	/**
	 * @param array $data
	 */
	public function __construct(array $data) {
		parent::__construct(self::STATUS_OK);
		$this->data = $data;
	}
	
	/**
	 * (non-PHPdoc)
	 * @see \GTD\Response\AbstractResponse::jsonSerializeImpl()
	 */
	protected function jsonSerializeImpl() {
		return $this->data;
	}
}