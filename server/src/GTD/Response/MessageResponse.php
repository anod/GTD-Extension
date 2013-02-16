<?php 
namespace GTD\Response;

class MessageResponse extends AbstractResponse{
	/**
	 * @var \Zend\Mail\Storage\Message
	 */
	private $message;
	
	/**
	 * @param \Zend\Mail\Storage\Message $message
	 */
	public function __construct(\Zend\Mail\Storage\Message $message) {
		parent::__construct(self::STATUS_OK);
		$this->message = $message;
	}
	
	/**
	 * (non-PHPdoc)
	 * @see \GTD\Response\AbstractResponse::jsonSerializeImpl()
	 */
	protected function jsonSerializeImpl() {
		return array(
			'subject' => $this->message->getHeader('subject', 'string'),
			'body' => $this->message->getContent()
		);
	}
	
}