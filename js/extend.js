		String.prototype.trim=function(){
　　    return this.replace(/(^\s*)|(\s*$)/g, "");
　　 }
　　 String.prototype.ltrim=function(){
　　    return this.replace(/(^\s*)/g,"");
　　 }
　　 String.prototype.rtrim=function(){
　　    return this.replace(/(\s*$)/g,"");
　　 }

 function trim(str){ //删除左右两端的空格
　　     return str.replace(/(^\s*)|(\s*$)/g, "");
　　 }
　　 function ltrim(str){ //删除左边的空格
　　     return str.replace(/(^\s*)/g,"");
　　 }
　　 function rtrim(str){ //删除右边的空格
　　     return str.replace(/(\s*$)/g,"");
　　 }

(function () {
    var environment = "DEV";//PRD、DEV、STG1、STG2
    
    window.phutil = {

        /**
         * 向本地保存对象数据
         */
        data: function (key, value) {
            if (value === undefined) {
                // 读取数据
                var data = localStorage.getItem(key);
                data = eval('(' + data + ')');
                return data;
            } else if (value === null) {
                // 删除数据
                localStorage.removeItem(key);
            } else {
                // 设置数据
                if (typeof value == "string") {
                    localStorage.setItem(key, value);
                } else {
                    localStorage.setItem(key, JSON2String(value));
                }
            }
        },
        addCookie: function(name,value,path, expiresHours){
            var cookieString= name+"="+escape(value);
            //判断是否设置过期时间
            if(expiresHours>0){
                var date=new Date();
                date.setTime(date.getTime()+expiresHours*3600*1000);
                cookieString=cookieString+"; expires="+date.toGMTString();
            }

            cookieString +=  "; path=" +( path ? path : "/");
            document.cookie=cookieString;
        },
        getCookie: function(name){
            var strCookie=document.cookie;
            var arrCookie=strCookie.split("; ");
            for(var i=0;i<arrCookie.length;i++){
                var arr=arrCookie[i].split("=");
                if(arr[0]==name)return arr[1];
            }
            return "";
        },
        deleteCookie: function(name){
            var date=new Date();
            date.setTime(date.getTime()-10000);
            document.cookie=name+"=v; expires="+date.toGMTString();
        },
        //将推荐码放入cookie
        initRecommendCode:function(){
        	  var recodeName = "RECOMMEND_CODE_NAME"
                  ,reCode = DJ.getParam("reCode");
              if(reCode){
                  DJ.addCookie(recodeName, reCode);
              }
        },
        initChannelSource: function(){
            var channelSourceName = "CHANNEL_SOURCE_NAME"
                , channelSource = DJ.getCookie(channelSourceName)
                , csid = DJ.getParam("WT.cs_id")
                , referer = document.referrer;
          
            if(csid === "" && channelSource){
                return;
            }

            if (csid) {
                channelSource = DJ.getChannelSource(csid);
                /* 写到cookie中 */
                if(channelSource){
                    DJ.addCookie(channelSourceName, channelSource);
                }
            }else{
                    if (referer) {
                        channelSource = DJ.parseURL(referer).host
                    } else {
                        // 无访前链接,记录为"direct"
                        channelSource = "dianjinhe";
                    }
                    channelSource = DJ.truncate(channelSource);
                    /* 写到cookie中 */
                    DJ.addCookie(channelSourceName, channelSource);
            }
        },getChannelSource: function (channelSource) {
            //截取下划线之前的字符串为媒体来源
            if(channelSource.indexOf("_") != -1){
                channelSource = channelSource.split("_")[0];
            }
            /* 如果url中含WT.mc_id参数,写到cookie中 */
            channelSource = DJ.truncate(channelSource);
            return channelSource;
        },truncate: function(source) {
            var maxLength = 40;
            if (source && source.length > maxLength) {
                return source.substring(0, maxLength);
            } else {
                return source;
            }
        },
        /**
         * 解析url
         */
        parseURL : function(url) {
            var a =  document.createElement('a');
            a.href = url;
            return {
                source: url,
                protocol: a.protocol.replace(':',''),
                host: a.hostname,
                port: a.port,
                query: a.search,
                params: function(){
                    var ret = {},
                        seg = a.search.replace(/^\?/,'').split('&'),
                        len = seg.length, i = 0, s;
                    for (;i<len;i++) {
                        if (!seg[i]) { continue; }
                        s = seg[i].split('=');
                        ret[s[0]] = s[1];
                    }
                    return ret;
                }
            }
        },
        /**
         * 小数转换为百分比
         */
        toPercent:function(n){
        	if(this.isNumber(n)){
        		return (phutil.accMul(n, 100)) + "%"; 
        	}
        	
        	return "";
        },isNumber:function(val){
        	if(!isNaN(val)){
        		   return true;
    		}else{
    			return false;
    		}
        },
        /**
         * //金额格式化函数?
         */
        formatMoney: function (s, type) {
            if (/[^0-9\.]/.test(s))
                return "0";
            if (s == null || s == "")
                return "0";
            s = Math.round((Number(s)+0.0000001)*100)/100.0;
            s = s.toString().replace(/^(\d*)$/, "$1.");
            s = (s + "00").replace(/(\d*\.\d\d)\d*/, "$1");
            s = s.replace(".", ",");
            var re = /(\d)(\d{3},)/;
            while (re.test(s))
                s = s.replace(re, "$1,$2");
            s = s.replace(/,(\d\d)$/, ".$1");
            if (type == 0) {// 不带小数位(默认是有小数位)
                var a = s.split(".");
                if (a[1] == "00") {
                    s = a[0];
                }
            }
            return "" + s;
        },
        // 除法函数，用来得到精确的除法结果
        // 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
        // 调用：accDiv(arg1,arg2)
        // 返回值：arg1除以arg2的精确结果
        accDiv: function (arg1, arg2) {
            var t1 = 0, t2 = 0, r1, r2;
            try {
                t1 = arg1.toString().split(".")[1].length
            } catch (e) {
            }
            try {
                t2 = arg2.toString().split(".")[1].length
            } catch (e) {
            }
            with (Math) {
                r1 = Number(arg1.toString().replace(".", ""))
                r2 = Number(arg2.toString().replace(".", ""))
                return (r1 / r2) * pow(10, t2 - t1);
            }
        },

        // 乘法函数，用来得到精确的乘法结果
        // 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
        // 调用：accMul(arg1,arg2)
        // 返回值：arg1乘以arg2的精确结果
        accMul: function (arg1, arg2) {
            var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
            try {
                m += s1.split(".")[1].length
            } catch (e) {
            }
            try {
                m += s2.split(".")[1].length
            } catch (e) {
            }
            return Number(s1.replace(".", "")) * Number(s2.replace(".", ""))
                / Math.pow(10, m)
        },

        // 加法函数，用来得到精确的加法结果
        // 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
        // 调用：accAdd(arg1,arg2)
        // 返回值：arg1加上arg2的精确结果
        accAdd: function (arg1, arg2) {
            var r1, r2, m;
            try {
                r1 = arg1.toString().split(".")[1].length
            } catch (e) {
                r1 = 0
            }
            try {
                r2 = arg2.toString().split(".")[1].length
            } catch (e) {
                r2 = 0
            }
            m = Math.pow(10, Math.max(r1, r2));

            return phutil.accDiv((phutil.accMul(arg1, m) + phutil.accMul(arg2, m)), m);
        },

        // 减法函数
        accSub: function (arg1, arg2) {
            return phutil.accAdd(arg1, -arg2);
        },

        /**
         * 获取URL参数
         */
        getParam: function (key) {
            var reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)', 'i');
            var r = window.location.search.substr(1).match(reg);
            if (r != null) {
                return unescape(r[2]);
            }
            return '';
        },

        /**
         * 日期处理工具类
         */
        DateUtil: {
            /**
             * 判断闰年
             * @param date Date日期对象
             * @return boolean true 或false
             */
            isLeapYear: function (date) {
                return (0 == date.getYear() % 4 && ((date.getYear() % 100 != 0) || (date.getYear() % 400 == 0)));
            },
            /**
             * 日期对象转换为指定格式的字符串
             * @param f 日期格式,格式定义如下 yyyy-MM-dd HH:mm:ss
             * @param date Date日期对象, 如果缺省，则为当前时间
             *
             * YYYY/yyyy/YY/yy 表示年份
             * MM/M 月份
             * W/w 星期
             * dd/DD/d/D 日期
             * hh/HH/h/H 时间
             * mm/m 分钟
             * ss/SS/s/S 秒
             * @return string 指定格式的时间字符串
             */
            dateToStr: function (formatStr, date) {
                formatStr = arguments[0] || "yyyy-MM-dd HH:mm:ss";
                date = arguments[1] || new Date();
                var str = formatStr;
                var Week = ['日', '一', '二', '三', '四', '五', '六'];
                str = str.replace(/yyyy|YYYY/, date.getFullYear());
                str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100));
                str = str.replace(/MM/, date.getMonth() >= 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1));
                str = str.replace(/M/g, date.getMonth());
                str = str.replace(/w|W/g, Week[date.getDay()]);

                str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate());
                str = str.replace(/d|D/g, date.getDate());

                str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours());
                str = str.replace(/h|H/g, date.getHours());
                str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes());
                str = str.replace(/m/g, date.getMinutes());

                str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds());
                str = str.replace(/s|S/g, date.getSeconds());

                return str;
            },


            /**
             * 日期计算
             * @param strInterval string  可选值 y 年 m月 d日 w星期 ww周 h时 n分 s秒
             * @param num int
             * @param date Date 日期对象
             * @return Date 返回日期对象
             */
            dateAdd: function (strInterval, num, date) {
                date = arguments[2] || new Date();
                switch (strInterval) {
                    case 's' :
                        return new Date(date.getTime() + (1000 * num));
                    case 'n' :
                        return new Date(date.getTime() + (60000 * num));
                    case 'h' :
                        return new Date(date.getTime() + (3600000 * num));
                    case 'd' :
                        return new Date(date.getTime() + (86400000 * num));
                    case 'w' :
                        return new Date(date.getTime() + ((86400000 * 7) * num));
                    case 'm' :
                        return new Date(date.getFullYear(), (date.getMonth()) + num, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                    case 'y' :
                        return new Date((date.getFullYear() + num), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                }
            },

            /**
             * 比较日期差 dtEnd 格式为日期型或者有效日期格式字符串
             * @param strInterval string  可选值 y 年 m月 d日 w星期 ww周 h时 n分 s秒
             * @param dtStart Date  可选值 y 年 m月 d日 w星期 ww周 h时 n分 s秒
             * @param dtEnd Date  可选值 y 年 m月 d日 w星期 ww周 h时 n分 s秒
             */
            dateDiff: function (strInterval, dtStart, dtEnd) {
                switch (strInterval) {
                    case 's' :
                        return parseInt((dtEnd - dtStart) / 1000);
                    case 'n' :
                        return parseInt((dtEnd - dtStart) / 60000);
                    case 'h' :
                        return parseInt((dtEnd - dtStart) / 3600000);
                    case 'd' :
                        return parseInt((dtEnd - dtStart) / 86400000);
                    case 'w' :
                        return parseInt((dtEnd - dtStart) / (86400000 * 7));
                    case 'm' :
                        return (dtEnd.getMonth() + 1) + ((dtEnd.getFullYear() - dtStart.getFullYear()) * 12) - (dtStart.getMonth() + 1);
                    case 'y' :
                        return dtEnd.getFullYear() - dtStart.getFullYear();
                }
            },

            /**
             * 字符串转换为日期对象
             * @param date Date 格式为yyyy-MM-dd HH:mm:ss，必须按年月日时分秒的顺序，中间分隔符不限制
             */
            strToDate: function (dateStr) {
                var datenew = dateStr;
                var reCat = /(\d{1,4})/gm;
                if(datenew==null||datenew==''){
                	return null;
                }
                var t = datenew.match(reCat);
                t[1] = t[1] - 1;
                eval('var d = new Date(' + t.join(',') + ');');
                return d;
            },

            /**
             * 把指定格式的字符串转换为日期对象yyyy-MM-dd HH:mm:ss
             *
             */
            strFormatToDate: function (formatStr, dateStr) {
                var year = 0;
                var start = -1;
                var len = dateStr.length;
                if ((start = formatStr.indexOf('yyyy')) > -1 && start < len) {
                    year = dateStr.substr(start, 4);
                }
                var month = 0;
                if ((start = formatStr.indexOf('MM')) > -1 && start < len) {
                    month = parseInt(dateStr.substr(start, 2)) - 1;
                }
                var day = 0;
                if ((start = formatStr.indexOf('dd')) > -1 && start < len) {
                    day = parseInt(dateStr.substr(start, 2));
                }
                var hour = 0;
                if (((start = formatStr.indexOf('HH')) > -1 || (start = formatStr.indexOf('hh')) > 1) && start < len) {
                    hour = parseInt(dateStr.substr(start, 2));
                }
                var minute = 0;
                if ((start = formatStr.indexOf('mm')) > -1 && start < len) {
                    minute = dateStr.substr(start, 2);
                }
                var second = 0;
                if ((start = formatStr.indexOf('ss')) > -1 && start < len) {
                    second = dateStr.substr(start, 2);
                }
                return new Date(year, month, day, hour, minute, second);
            },


            /**
             * 日期对象转换为毫秒数
             */
            dateToLong: function (date) {
                return date.getTime();
            },

            /**
             * 毫秒转换为日期对象
             * @param dateVal number 日期的毫秒数
             */
            longToDate: function (dateVal) {
                return new Date(dateVal);
            },

            /**
             * 判断字符串是否为日期格式
             * @param str string 字符串
             * @param formatStr string 日期格式， 如下 yyyy-MM-dd
             */
            isDate: function (str, formatStr) {
                if (formatStr == null) {
                    formatStr = "yyyyMMdd";
                }
                
                if(str.length != formatStr.length){
                	return false;
                }
                var yIndex = formatStr.indexOf("yyyy");
                if (yIndex == -1) {
                    return false;
                }
                var year = str.substring(yIndex, yIndex + 4);
                var mIndex = formatStr.indexOf("MM");
                if (mIndex == -1) {
                    return false;
                }
                var month = str.substring(mIndex, mIndex + 2);
                var dIndex = formatStr.indexOf("dd");
                if (dIndex == -1) {
                    return false;
                }
                var day = str.substring(dIndex, dIndex + 2);
                if (!this.isNumber(year) || year > "2100" || year < "1900") {
                    return false;
                }
                if (!this.isNumber(month) || month > "12" || month < "01") {
                    return false;
                }
                if (day > this.getMaxDay(year, month) || day < "01") {
                    return false;
                }
                return true;
            },

            getMaxDay: function (year, month) {
                if (month == 4 || month == 6 || month == 9 || month == 11)
                    return "30";
                if (month == 2)
                    if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0)
                        return "29";
                    else
                        return "28";
                return "31";
            },
            /**
             *   变量是否为数字
             */
            isNumber: function (str) {
                var regExp = /^\d+$/g;
                return regExp.test(str);
            },

            /**
             * 把日期分割成数组 [年、月、日、时、分、秒]
             */
            toArray: function (myDate) {
                myDate = arguments[0] || new Date();
                var myArray = Array();
                myArray[0] = myDate.getFullYear();
                myArray[1] = myDate.getMonth();
                myArray[2] = myDate.getDate();
                myArray[3] = myDate.getHours();
                myArray[4] = myDate.getMinutes();
                myArray[5] = myDate.getSeconds();
                return myArray;
            },

            /**
             * 取得日期数据信息
             * 参数 interval 表示数据类型
             * y 年 M月 d日 w星期 ww周 h时 n分 s秒
             */
            datePart: function (interval, myDate) {
                myDate = arguments[1] || new Date();
                var partStr = '';
                var Week = ['日', '一', '二', '三', '四', '五', '六'];
                switch (interval) {
                    case 'y' :
                        partStr = myDate.getFullYear();
                        break;
                    case 'M' :
                        partStr = myDate.getMonth() + 1;
                        break;
                    case 'd' :
                        partStr = myDate.getDate();
                        break;
                    case 'w' :
                        partStr = Week[myDate.getDay()];
                        break;
                    case 'ww' :
                        partStr = myDate.WeekNumOfYear();
                        break;
                    case 'h' :
                        partStr = myDate.getHours();
                        break;
                    case 'm' :
                        partStr = myDate.getMinutes();
                        break;
                    case 's' :
                        partStr = myDate.getSeconds();
                        break;
                }
                return partStr;
            },

            /**
             * 取得当前日期所在月的最大天数
             */
            maxDayOfDate: function (date) {
                date = arguments[0] || new Date();
                date.setDate(1);
                date.setMonth(date.getMonth() + 1);
                var time = date.getTime() - 24 * 60 * 60 * 1000;
                var newDate = new Date(time);
                return newDate.getDate();
            }
        }
    };
})();