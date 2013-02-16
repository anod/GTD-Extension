<?php 
namespace GTD\Response;

class OkResponse extends AbstractResponse{
	
	public function __construct() {
		parent::__construct(self::STATUS_OK);
	}
	
	/**
	 * (non-PHPdoc)
	 * @see \GTD\Response\AbstractResponse::jsonSerializeImpl()
	 */
	protected function jsonSerializeImpl() {
		return array();
	}
	
}