# fis3-command-r

## 安装

`npm install -g fis3-command-r`

## 使用

*仅限百度外卖内部结合RAPX使用*


     Usage: fis r [media name] -m

     Options:

       -m, --mock       读取根木录下rapx-mock.conf，根据相应正则，动态插入插件代码到 指定tpl 中
      --init            在根目录下，初始化一个rapx-mock.conf模板文件
      --reset           重置被替换的smarty plugin（结合参数-m）

## rapx-mock.conf规则

```pyhton
# 指令 replace regExpString
#   匹配所有所需插入的文件 的替换正则
#       regExpString有三个捕获项($1$2$3)，执行content.replace(regExpString, '$1$2xxx$3')，其中xxx为插入的文本内容
#       regExpString 默认值为 (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})
#       默认插入到{%block name='top-head-extend'%}块中

# 指令 mock /page/aaa.tpl xxx
# mock标识符 需要插入的文件(当前目录绝对路径) 需要插入的文本

# 原理/效果:
# 匹配 /page/aaa.tpl的文本内容，并在发布的过程中，执行content.replace(regExpString, '$1$2xxx$3'),在{%block name='top-head-extend'%}和{%/block%}中插入xxx

# replace (\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})

# mock /page/index.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=1" type="js"%}
# mock /page/index2.tpl {%require src="http://avalon.inwaimai.baidu.com:8888/rap.plugin.js?projectId=2" type="js"%}
```
