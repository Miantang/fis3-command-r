# fis3-command-r

## 开始使用

*仅限百度外卖内部结合RAPX使用*

1. 全局安装插件

`npm install -g fis3-command-r`

2. 在工程目录下初始化生成一个rapx-mock.conf

`fis3 r --init`

3. 编写mock规则，使用fis3 r [media name] -m (fis3 r 是fis3 release的继承版，新增参数-m), 读取相应的rapx-mock.conf配置，完成mock代码的插入

## 优势

可定制化地统一管理项目工程目录下的mock规则，相比直接插入mock规则代码，对业务代码无污染

## 原理

匹配相应的模板文件(如xxx.tpl)的文本内容，并在发布的过程中，对每个命中的执行tplContent.replace(`regExpString`, '$1$2{mockCode}$3'), 插入{mockCode}
默认是在{%block name='top-head-extend'%}和{%/block%}中插入Mock代码{mockCode}

## 命令行相关参数

     Options:

       -m, --mock       读取根木录下rapx-mock.conf，根据相应正则，动态插入插件代码到 指定tpl 中
      --init            在根目录下，初始化一个rapx-mock.conf模板文件
      --reset           重置被替换的smarty plugin（与参数-m同时使用）

## rapx-mock.conf规则

### 可接受的操作符

mock, vue,vueResource, axios, insertFileExt, replace

|操作符|语法||含义/参数释义|默认值|
|----|------|----|----|---|
|**mock**|mock {tplPath} {mockCode}||将Mock插件代码{mockCode} 插入到需要插入的文件(当前目录绝对路径{tplPath}) 需要插入的文本||
| ||{tplPath} |需要插入的tpl文件路径, 如 “/page/index.tpl”||
| ||{mockCode}|从RAPX平台上复制下来的Mock插件代码，如“{%require src="htt://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=1" type="js"%}”||
|**vue**|vue {vuePath}||如果需要支持vueResource的Mock扩展，需要将其模块地址声明于此||
|**vueResource**|vueResource {vueResourcePath}||如果需要支持vueResource的Mock扩展，需要将其模块地址声明于此（与vue声明一起）||
|**axios**|axios {axiosPath}||如果需要支持axios的Mock扩展，需要将其模块地址声明于此（与vue声明一起）||
| || {axiosPath}|mod.js require 引入的模块地址 如: nerve_common:static/js/axios.js||
|insertFileExt|insertFileExt {Ext}||声明需要匹配的模板文件格式，默认为.tpl||
| || {Ext}|需要支持的模板文件后缀，如有多个，用空格隔开。如：.tpl  .html|.tpl|
|replace|replace {regExpString}||**匹配所有所需插入的文件 的替换正则**。regExpString有三个捕获项($1$2$3)，内部将执行tplContent.replace(regExpString, '$1$2{mockCode}$3')，其中{mockCode}为插入的文本内容, 默认插入到{%block name='top-head-extend'%}和{%/block%}中||
||| {regExpString}||默认值如下|

`replace (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})`

## 示例
```pyhton
# replace (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})
# insertFileExt .tpl .html .xxx
# mock /page/index.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=1" type="js"%}
# mock /page/index2.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=2" type="js"%}

```
