<?php
namespace GTD;

class ControllerMock extends \GTD\Controller {
	private $methodReturns = array();
	
	public function setMethodReturn($method, $return) {
		$this->methodReturns[$method] = $return;
	}
	
	public function setGmail(\Anod\Gmail\Gmail $gmail) {
		$this->gmail = $gmail;
	}
	
	public function setArchive($archive)  {
		$this->archive = $archive;
	}
	
	
	/* (non-PHPdoc)
	 * @see \GTD\Controller::initGmail()
	 */
	protected function initGmail() {
		return $this->methodReturns[__FUNCTION__];
	}

	
	/* (non-PHPdoc)
	 * @see \GTD\Controller::actionLabels()
	 */
	public function actionLabels($uid, array $request) {
		if (array_key_exists(__FUNCTION__, $this->methodReturns)) {
			return $this->methodReturns[__FUNCTION__];
		}
		return parent::actionLabels($uid, $request);
	}

	public function actionContent($uid) {
		if (array_key_exists(__FUNCTION__, $this->methodReturns)) {
			return $this->methodReturns[__FUNCTION__];
		}
		return parent::actionContent($uid);
	}

	public function actionThreadLabels($uid) {
		if (array_key_exists(__FUNCTION__, $this->methodReturns)) {
			return $this->methodReturns[__FUNCTION__];
		}
		return parent::actionThreadLabels($uid);
	}
	
	public function actionDelete($uid) {
		if (array_key_exists(__FUNCTION__, $this->methodReturns)) {
			return $this->methodReturns[__FUNCTION__];
		}
		return parent::actionDelete($uid);
	}
	
	/* (non-PHPdoc)
	 * @see \GTD\Controller::getGtdLabels()
	 */
	public function getGtdLabels($uid) {
		if (array_key_exists(__FUNCTION__, $this->methodReturns)) {
			return $this->methodReturns[__FUNCTION__];
		}
		return parent::getGtdLabels($uid);
	}

}