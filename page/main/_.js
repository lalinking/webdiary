const contentMap = new Map();
const $rootDiv = $(".root-div")[0];
const $search = $(".search-input")[0];
const $contentDiv = $(".content-div")[0];
const showInfo = msg => {
    let $msgDiv = $(".msg-div")[0];
    $msgDiv.className = "";
    setTimeout(() => {
        $msgDiv.innerText = msg;
        $msgDiv.className = "msg-div msg-flash";
    }, 0);
};

const appendResult = (info) => {
    if (info.lastVisitTime) {
        info.lastVisitTime = i18n("ui_visitdate") + new Date(info.lastVisitTime).format("yyyy-MM-dd HH:mm")
    } else {
        info.lastVisitTime = "-"
    }
    if (!info.title) {
        info.title = "-"
    } else {
        info.title = info.title.replace(/\</g, "&lt;")
    }
    let number = info.url.replace(/^https/, "http").hashCode();
    let bookmark = info.fromBookmark ? `<span class="bookmark">★</span>` : `<span class="bookmark-add">☆</span>`;
    if (info.visitCount !== undefined) {
        info.visitCount = info.visitCount + i18n("ui_visitcount")
    } else {
        info.visitCount = "-"
    }
    let groupDivID = "group-" + info.group.hashCode();
    let $group = $("#" + groupDivID, $contentDiv);
    if ($group.length > 0) {
        $group = $group[0];
    } else {
        let groupDeleteBtn = `<div><button class="btn" name="btn_sites_delete">${i18n("btn_sites_delete")}</button></div>`;
        let groupRemarkBtn = `<div><button class="btn" name="group_remark">${i18n("btn_sites_remark")}</button></div>`;
        let favicon = `<img src="http://${info.group}/favicon.ico"/>`;
        let groupTool = `<div class="tool-group-div">${groupDeleteBtn}${groupRemarkBtn}</div>`;
        $group = createNode(`<div class="content-group" name="group" data-groupname="${info.group}" id="${groupDivID}">${favicon}<span>${info.group}</span><button class="btn" name="group_btn">┇</button>${groupTool}<div class="text-ellipsis" name='remark'></div></div>`);
        $contentDiv.appendChild($group);
        let key = getGroupStoreKey(info.group);
        chrome.storage.local.get(key, res => {
            let g = res[key];
            if (!g) return;
            if (g.rm) {
                $group.setAttribute("data-rm", "true");
                $group.setAttribute("title", i18n("ui_sites_incognito"));
            }
            if (g.remark) $("[name=remark]", $group)[0].innerHTML = g.remark;
        })
    }
    let countAndDate = `<span class="content-item-visitcount ">${info.visitCount}</span><span class="content-item-date">${info.lastVisitTime}</span>`;
    let detail = `<div class="content-item-detail"><div class="text-ellipsis">${info.title}<br>${info.url}</div></div>`;
    let itemA = `<a target="_blank" href="${info.url}">${detail}<span class="text-ellipsis">${info.title}</span></a>`;
    let item = createNode(`<div class="content-item" name="item" id="item-${number}">${bookmark}${countAndDate}${itemA}<button name="rm_history" class="btn item-btn">×</button></div>`);
    $group.appendChild(item);
    if ($group.children.length > 14) {
        item.className += " content-item-more";
    }
};
const search = () => {
    $contentDiv.innerHTML = "";
    contentMap.clear();
    let async = new Async();
    let val = $search.value;
    let warnSize = val ? 200 : 50;
    async.call(() => {
        chrome.bookmarks.search(val, res1 => {
            res1.forEach(r => {
                let _url = r.url;
                if (!_url) return;
                let key = _url.replace(/^https/, "http").hashCode();
                r.group = getUrlGroupName(_url);
                r.fromBookmark = true;
                r.bookMarkID = r.id;
                contentMap.set(key, r);
                warnSize ++;
                async.call(() => {
                    chrome.history.getVisits({url: _url}, res2 => {
                        r.visitCount = res2.length;
                        let lastVisitTime = 0;
                        res2.forEach(v => {
                            lastVisitTime = Math.max(v.visitTime, lastVisitTime);
                        });
                        if (lastVisitTime) {
                            r.lastVisitTime = lastVisitTime
                        }
                        async.next()
                    })
                })
            });
            async.next()
        })
    }).call(() => {
        chrome.history.search({
            text: val,
            startTime: 0,
            endTime: Date.now(),
            maxResults: val ? 200 : 50
        }, res1 => {
            res1.forEach(r => {
                r.group = r.group || getUrlGroupName(r.url);
                let key = r.url.replace(/^https/, "http").hashCode();
                if (contentMap.has(key)) {
                    let _r = contentMap.get(key);
                    _r.lastVisitTime = r.lastVisitTime;
                    _r.visitCount = r.visitCount;
                } else {
                    contentMap.set(key, r);
                }
            });
            async.next()
        })
    }).end = () => {
        contentMap.forEach(appendResult);
        if (val && contentMap.size > warnSize - 20) {
            showInfo(i18n("msg_more"))
        } else if (contentMap.size === 0) {
            showInfo(i18n("msg_nores"))
        }
        $(".content-item-more:last-child").forEach(item => {
            item.parentElement.className += " large-group";
            item.parentElement.appendChild(createNode(`<div class="showmore" name="more"><a href="javascript:">${i18n("ui_showmore")}</a></div>`))
        })
    }
};

const addToMarkbook = (info, target) => {
    let _title = prompt(i18n("btn-addbookmark"), info.title);
    if (_title) {
        chrome.bookmarks.create({url: info.url, title: _title}, res => {
            target.className = "bookmark";
            target.id = target.id.replace("add-bookmark-", "remove-bookmark-");
            target.innerText = "★";
            info.bookMarkID = res.id
        })
    }
};
const removeMarkbook = (info, target) => {
    chrome.bookmarks.remove(info.bookMarkID, () => {
        target.className = "bookmark-add";
        target.id = target.id.replace("remove-bookmark-", "add-bookmark-");
        target.innerText = "☆"
    })
};
const removeHistory = (info, itemDiv) => {
    chrome.history.deleteUrl({url: info.url}, () => {
        itemDiv.remove()
    })
};
const removeSiteHistory = (groupName, groupDiv) => {
    let async = new Async();
    async.end = () => {
        groupDiv.remove();
        showInfo(i18n("msg_succeed"))
    };
    showInfo(i18n("msg_processing"));
    let clearFun = () => {
        chrome.history.search({
            text: groupName,
            startTime: 0,
            endTime: Date.now()
        }, res1 => {
            let async2 = new Async();
            async2._size = res1.size;
            async2.end = () => {
                if (async2._size > 0) {
                    async.call(clearFun)
                }
                async.next()
            };
            res1.forEach(r => {
                let _r = r;
                async2.call(() => {
                    if (groupName == getUrlGroupName(_r.url)) {
                        chrome.history.deleteUrl({url: _r.url}, () => {
                            async2.next()
                        })
                    } else {
                        async2.next()
                    }
                })
            });
        })
    };
    async.call(clearFun);
};
const makeRemark = groupName => {
    $rootDiv.className = "root-div disable";
    let panel = $("#remark_panel")[0];
    panel.className = "";
    let key = getGroupStoreKey(groupName);
    chrome.storage.local.get(key, res => {
        let _obj = res[key] || {name: groupName, remark: ""};
        _obj.key = key;
        _obj.rm = _obj.rm ? true : undefined;
        _obj.time = _obj.time ? new Date(_obj.time).format("yyyy-MM-dd HH:mm:ss") : "-"
        bind(_obj, panel)
    })
};
// 添加一些事件、初始化页面
bind({
    ui_search: i18n("ui_search_placehold"),
    ui_sites_incognito_mode: i18n("ui_sites_incognito"),
    ui_sites_remark: i18n("ui_sites_remark"),
    ui_sites_optime: i18n("ui_sites_optime"),
    ui_btn_cancel: i18n("btn_cancel"),
    ui_btn_save: i18n("btn_save"),
    ui_btn_remove: i18n("btn_remove")
}, document);

let searchTimeout;
$search.addEventListener("keyup", e => {
    if (e.keyCode < 65 && e.keyCode != 13 && e.keyCode != 8 && e.keyCode != 46) return;
    clearTimeout(searchTimeout);
    if (e.keyCode == 13) {
        if (e.altKey && $search.value) {
            chrome.tabs.create({url: "https://www.google.com/search?q=" + $search.value})
        } else {
            search();
        }
    } else {
        if ($search.value) searchTimeout = setTimeout(search, 600)
    }
});
const itemClickFun = (e, div) => {
    let key = parseInt(div.id.replace("item-", ""));
    let info = contentMap.get(key);
    if (e.target.className === "bookmark-add") {
        addToMarkbook(info, e.target)
    } else if (e.target.className === "bookmark") {
        removeMarkbook(info, e.target)
    } else if (e.target.getAttribute("name") == "rm_history") {
        removeHistory(info, div)
    }
};
const groupClickFun = (e, div) => {
    let groupName = div.getAttribute("data-groupname");
    let storeKey = getGroupStoreKey(groupName);
    let name = e.target.getAttribute("name");
    if (name == "btn_sites_delete") {
        removeSiteHistory(groupName, div)
    } else if (name === "group_remark") {
        makeRemark(groupName);
    }
};
$contentDiv.addEventListener("click", e => {
    $(".tool-group-div").forEach(dom => {
        dom.style.display = ""
    });
    let div = e.target;
    while (div) {
        let name = div.getAttribute("name");
        if (name == "group_btn") {
            return $(".tool-group-div", div.parentElement)[0].style.display = "block";
        } else if (name == "item") {
            return itemClickFun(e, div)
        } else if (name == "group") {
            return groupClickFun(e, div)
        } else if (name == "more") {
            return div.parentElement.className = "content-group"
        }
        div = div.parentElement;
    }
});
$(".setting-btn")[0].addEventListener("click", () => {
    location.href = "/page/setting/_.html"
});
$("[name='ui_btn_remove']")[0].addEventListener("click", () => {
    chrome.storage.local.remove($("#remark_panel [name=key]")[0].value, () => {
        if (chrome.runtime.lastError) {
            alert(i18n("msg_err") + chrome.runtime.lastError.message)
        } else {
            $('#remark_panel')[0].className = 'hide';
            $rootDiv.className = "root-div";
        }
    })
});
$("[name='ui_btn_cancel']")[0].addEventListener("click", () => {
    $('#remark_panel')[0].className = 'hide';
    $rootDiv.className = "root-div";
});
$("[name='ui_btn_save']")[0].addEventListener("click", () => {
    let _data = {
        name: $("#remark_panel [name=name]")[0].innerText,
        rm: $("#remark_panel [name=rm]")[0].checked,
        remark: $("#remark_panel [name=remark]")[0].value,
        time: Date.now()
    };
    let _store = {};
    _store[$("#remark_panel [name=key]")[0].value] = _data;
    chrome.storage.local.set(_store, () => {
        if (chrome.runtime.lastError) {
            alert(i18n("msg_err") + chrome.runtime.lastError.message)
        } else {
            $('#remark_panel')[0].className = 'hide';
            $rootDiv.className = "root-div";
        }
    })
});
document.addEventListener("keydown", e => {
    if (e.target.tagName == "TEXTAREA") {
        return;
    }
    if (e.keyCode !== 38 && e.keyCode !== 40) {
        return $search.focus();
    }
    clearTimeout(searchTimeout);
    let aList = [].slice.call($(".content-group div:not(.content-item-more) a"));
    let itemSize = aList.length;
    if (itemSize === 0) return;
    let currentA = $("a:focus");
    let currentIndex;
    if (currentA.length === 1) {
        for (let index = 0; index < itemSize; index++) {
            let a = aList[index];
            if (a === currentA[0]) {
                currentIndex = index;
                break
            }
        }
    } else {
        return aList[0].focus()
    }
    if (e.keyCode === 38) { // 上
        currentIndex = currentIndex < 1 ? itemSize - 1 : currentIndex - 1
    } else if (e.keyCode === 40) { // 下
        currentIndex = currentIndex > itemSize - 2 ? 0 : currentIndex + 1
    }
    aList[currentIndex].focus()
});

search();
$search.focus();