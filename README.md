# fis3-command-r

## 安装

`npm install -g fis3-command-r`

## 使用

*仅限百度外卖内部结合RAPX使用*


     Usage: fis3 r [media name] -m

     Options:

       -m, --mock       读取根木录下rapx-mock.conf，根据相应正则，动态插入插件代码到 指定tpl 中
      --init            在根目录下，初始化一个rapx-mock.conf模板文件
      --reset           重置被替换的smarty plugin（结合参数-m）

## rapx-mock.conf规则

```pyhton
# RAPX的mock插入规则
# 结合插件fis3-command-r <https://github.com/Miantang/fis3-command-r> fis3 r [media] -m 使用

# 原理:
# 匹配相应的.tpl文件的文本内容，并在发布的过程中，对每个命中的执行tplContent.replace(regExpString, '$1$2{mockCode}$3'),
# 在{%block name='top-head-extend'%}和{%/block%}中插入Mock代码{mockCode}

# 可接受的操作符: 
# replace, mock

# replace {regExpString}
#   @description: 匹配所有所需插入的文件 的替换正则
#   @params: 
#     {regExpString} default: (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})
#       regExpString有三个捕获项($1$2$3)，内部将执行tplContent.replace(regExpString, '$1$2{mockCode}$3')，其中{mockCode}为插入的文本内容
#       默认插入到{%block name='top-head-extend'%}和{%/block%}中

# mock {tplPath} {mockCode}
#   @description: 将Mock插件代码{mockCode} 插入到需要插入的文件(当前目录绝对路径{tplPath}) 需要插入的文本
#   @params: 
#     {tplPath} 需要插入的tpl文件路径, 如 “/page/index.tpl”
#     {mockCode} 从RAPX平台上复制下来的Mock插件代码，如“{%require src="htt://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=1" type="js"%}”

# e.g.

# replace (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})
# mock /page/index.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=1" type="js"%}
# mock /page/index2.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=2" type="js"%}

```
