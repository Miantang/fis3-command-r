<?php
function smarty_modifier_hideMidChars($str,$from=3,$len=4) {
    $substr = substr($str,$from,$len);
    return str_replace($substr, "****", $str);
}