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
		
		$body = '';
		if ($this->message->isMultipart()) {
			if ($this->message->countParts() > 0) {
				$body = $this->message->getPart(1)->getContent();
			}
		} else {
			$body = $this->message->getContent();
		}
		
		return array(
			'subject' => $this->message->getHeader('subject', 'string'),
			'body' => $body,
			'from' => $this->message->getHeader('from', 'string'),
			'to' => $this->message->getHeader('to', 'string'),
			'thrid' => \GTD\Math::bcdechex($this->message->getHeader('x-gm-thrid', 'string'))
		);
	}
	
}