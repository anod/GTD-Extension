<?php 
namespace GTD\Response;

class MessageResponse extends AbstractResponse{
	/**
	 * @var \Anod\Gmail\Message
	 */
	private $message;
	
	/**
	 * @param \Anod\Gmail\Message $message
	 */
	public function __construct(\Anod\Gmail\Message $message) {
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
			'thrid' => \Anod\Gmail\Math::bcdechex($this->message->getThreadId())
		);
	}
	
}