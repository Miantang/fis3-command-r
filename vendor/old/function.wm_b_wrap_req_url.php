<?php
/**
 * Smarty plugin
 */

/**
 * 提供针对外卖B端统一请求地址（anchor、ajax）格式的封装
 * 请求地址格式：app/controller/action?queryparams
 *
 * 如：{%wm_b_wrap_req_url app=settlement controller=payment action=getlist%} = > /settlement/payment/getlist
 * 
 * @param array                    $params   parameters
 * {
 * 	app:"settlement", //模块命名空间，可选
 * 	controller:"payment", //子业务模块，可选
 * 	action:"getlist" //功能 ，必填
 * }
 * @param Smarty_Internal_Template $template template object
 */

function smarty_function_wm_b_wrap_req_url($params,$template){

	$tmpl_system_var=$template->getTemplateVars('system');
	$tmpl_user_data=$template->getTemplateVars('audit_user');
	$result_url='/';

	$tmpl_system_var=empty($tmpl_system_var)?array():$tmpl_system_var;
	$tmpl_user_data=empty($tmpl_user_data)?array():$tmpl_user_data;

	if(empty($params['action'])){
		return $result_url;
	}

	$result_url .= !empty($params['app'])?$params['app']:$tmpl_system_var['app'];

	if(isset($tmpl_user_data['is_agent']) && $tmpl_user_data['is_agent']==1){
		$result_url .= '/agent';
	}
	else{
		//默认的controller为main
		$result_url .= '/' . (!empty($params['controller'])?$params['controller']:'main');
	}

	$result_url .= '/' . $params['action'];

	return $result_url;
}