const upgrade = true;
String.prototype.hashCode = function () {
    let hash = 5381;
    for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) + hash) + this.charCodeAt(i);
    }
    return hash;
};
Date.prototype.format = function (fmt) { //author: meizz
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

var $ = (selector, dom) => {
    return (dom || document).querySelectorAll(selector)
};

var createNode = (html) => {
    let nod = document.createElement("div");
    nod.innerHTML = html;
    return nod.children[0];
};

var bind = (obj, dom) => {
    dom = dom || document;
    let _obj = {
        ...obj
    };
    let _fs = function (name, value) {
        [].slice.call(dom.querySelectorAll(`[name="${name}"]`)).forEach(e => {
            let bindProty = e.getAttribute("data-bind");
            if (bindProty) {
                if (value == undefined) {
                    return e.removeAttribute(bindProty);
                } else {
                    return e.setAttribute(bindProty, value);
                }
            }
            if (e.tagName == "INPUT" || e.tagName == "TEXTAREA") {
                e.value = value;
            } else if (e.tagName == "A") {
                e.innerText = value;
                e.textContent = value;
                if (!e.href) {
                    e.href = value;
                }
            } else {
                e.innerText = value;
                e.textContent = value;
            }
        });
    };
    for (let _name in obj) {
        _fs(_name, obj[_name]);
        Object.defineProperty(obj, _name, {
            set: function (v) {
                _obj[_name] = v;
                _fs(_name, v);
            },
            get: function () {
                return _obj[_name];
            }
        })
    }
};

var Async = function (auto) {
    this.maxThread = 1;
    let _stime;
    let _lis = [];
    let sflag = 0;
    let _this = this;
    let _next = () => {
        setTimeout(() => {
            if (_lis.length === 0) {
                sflag--;
                if (sflag === 0) {
                    _this.end && _this.end(Date.now() - _stime);
                    _stime = null;
                }
                return
            }
            let l = _lis.shift();
            try {
                l.call(_this)
            } catch (e) {
                console.error(e)
            }
            auto && _next()
        }, 0)
    };
    this.call = (fun) => {
        _lis.push(fun);
        if (sflag < this.maxThread) {
            if (!_stime) {
                _stime = Date.now();
            }
            sflag++;
            _next()
        }
        return this
    };
    this.ignoreNext = () => {
        _lis.shift();
    };
    this.interrupt = (err) => {
        _lis.length = 0;
        _this.err = err || "interrupt";
    };
    this.next = _next
};

var i18n = msg => {
    return chrome.i18n.getMessage(msg)
};

var getLocalData = function(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}
var setLocalData = function(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

var getGroupStoreKey = groupName => {
    let hashCode = groupName.hashCode();
    return hashCode > 0 ? ("g" + hashCode) : ("h" + Math.abs(hashCode));
};

var getUrlGroupName = url => {
    return url.replace(/^[^:]+\:\/{2,}([^/#?!]+).*$/, "$1");
};
