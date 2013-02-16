<?php 
namespace GTD\Response;

class ErrorResponse extends AbstractResponse{
	/**
	 * @var string
	 */
	private $message;
	
	/**
	 * @param string $message
	 */
	public function __construct($message) {
		parent::__construct(self::STATUS_ERROR);
		$this->message = $message;
	}
	
	/**
	 * (non-PHPdoc)
	 * @see \GTD\Response\AbstractResponse::jsonSerializeImpl()
	 */
	protected function jsonSerializeImpl() {
		return array(
			'message' => $this->message	
		);
	}
	
}