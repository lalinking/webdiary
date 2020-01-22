let contentMap = new Map();
const $search = $(".search-input")[0];
let $contentDiv = $(".content-div")[0];

const search = searchingKey => {
    $contentDiv.innerHTML = "";
    contentMap.clear();
    let sync = new Sync();
    sync.end = () => {
        contentMap.forEach(appendResult);
        if (searchingKey && contentMap.size >= 300) {
            showInfo(i18n("msg_more"))
        } else if (contentMap.size === 0) {
            showInfo(i18n("msg_nores"))
        }
        $(".content-item-more:last-child").forEach(item => {
            item.parentElement.className += " large-group";
            item.parentElement.appendChild(createNode(`<div class="showmore">${i18n("newtab_showmore")}</div>`))
        })
    };
    if (searchingKey) {
        sync.call(() => {
            chrome.bookmarks.search(searchingKey, res1 => {
                res1.forEach(r => {
                    if (!r.url) {
                        return
                    }
                    r.group = getUrlGroupName(r.url);
                    r.fromBookmark = true;
                    r.bookMarkID = r.id;
                    contentMap.set(r.url.replace(/^https/, "http").hashCode(), r)
                });
                sync.next()
            })
        })
    }
    sync.call(() => {
        chrome.history.search({
            text: searchingKey,
            startTime: 0,
            endTime: Date.now(),
            maxResults: 300
        }, res1 => {
            if (res1.length === 0) {
                sync.next()
            }
            res1.forEach(r => {
                r.group = r.group || getUrlGroupName(r.url);
                let key = r.url.replace(/^https/, "http").hashCode();
                if (contentMap.has(key)) {
                    let _r = contentMap.get(key);
                    _r.lastVisitTime = r.lastVisitTime;
                    _r.visitCount = r.visitCount;
                    sync.next()
                } else {
                    contentMap.set(key, r);
                    if (!searchingKey) {
                        let _r = r;
                        chrome.bookmarks.search({url: r.url}, res2 => {
                            sync.next();
                            _r.fromBookmark = res2.length > 0;
                            if (!_r.fromBookmark) {
                                return;
                            }
                            _r.title = res2[0].title;
                            _r.bookMarkID = res2[0].id;
                        })
                    } else {
                        sync.next()
                    }
                }
            });
        })
    })
};

const appendResult = (info) => {
    if (info.lastVisitTime) {
        info.lastVisitTime = i18n("newtab_visitdate") + new Date(info.lastVisitTime).format("yyyy-MM-dd HH:mm")
    } else {
        info.lastVisitTime = "---"
    }
    if (!info.title) {
        info.title = "---"
    }
    let number = info.url.replace(/^https/, "http").hashCode();
    let bookmark = info.fromBookmark ? `<span class="bookmark">★</span>` : `<span class="bookmark-add">☆</span>`;
    if (info.visitCount !== undefined) {
        info.visitCount = info.visitCount + i18n("newtab_visitcount")
    } else {
        info.visitCount = "-"
    }
    let groupDivID = "group-" + info.group.hashCode();
    let $group = $("#" + groupDivID, $contentDiv);
    if ($group.length > 0) {
        $group = $group[0];
    } else {
        let groupDeleteBtn = `<div><button class="btn group-delete">${i18n("group_delete")}</button></div>`;
        let groupNoHistoryBtn = `<div><button class="btn group-nohistory">${i18n("group_nohistory")}</button></div>`;
        let groupBlackBtn = `<div><button class="btn group-black">${i18n("group_black")}</button></div>`;
        let favicon = `<img src="http://${info.group}/favicon.ico"/>`;
        let groupTool = `<div class="tool-group-div">${groupDeleteBtn}${groupNoHistoryBtn}${groupBlackBtn}</div>`;
        $group = createNode(`<div class="content-group" data-groupname="${info.group}" id="${groupDivID}">${favicon}<span>${info.group}</span><button class="btn group-btn">┇</button>${groupTool}</div>`);
        $contentDiv.appendChild($group);
    }
    let countAndDate = `<span class="content-item-visitcount ">${info.visitCount}</span><span class="content-item-date">${info.lastVisitTime}</span>`;
    let detail = `<div class="content-item-detail"><div class="text-ellipsis">${info.title}<br>${info.url}</div></div>`;
    let itemA = `<a target="_blank" href="${info.url}">${detail}<span class="text-ellipsis">${info.title}</span></a>`;
    let item = createNode(`<div class="content-item" id="item-${number}">${bookmark}${countAndDate}${itemA}<button class="btn item-btn">×</button></div>`);
    $group.appendChild(item);
    if ($group.children.length > 14) {
        item.className += " content-item-more";
    }
};

const showInfo = msg => {
    let $msgDiv = $(".msg-div")[0];
    $msgDiv.className = "";
    setTimeout(() => {
        $msgDiv.innerText = msg;
        $msgDiv.className = "msg-div msg-flash";
    }, 0);
};

const addToMarkbook = (info, target) => {
    let _title = prompt(i18n("newtab-addbookmark"), info.title);
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
    let sync = new Sync();
    sync.end = () => {
        groupDiv.remove();
        showInfo(i18n("msg_succeed"))
    };
    showInfo(i18n("msg_processing"));
    let clearFun = () => {
        chrome.history.search({
            text: "",
            startTime: 0,
            endTime: Date.now(),
            maxResults: 300
        }, res1 => {
            let sync2 = new Sync();
            sync2._size = res1.size;
            sync2.end = () => {
                if (sync2._size > 0) {
                    sync.call(clearFun)
                }
                sync.next()
            };
            res1.forEach(r => {
                let _r = r;
                sync2.call(() => {
                    if (groupName === getUrlGroupName(_r.url)) {
                        chrome.history.deleteUrl({url: _r.url}, () => {
                            sync2.next()
                        })
                    } else {
                        sync2.next()
                    }
                })
            });
        })
    };
    sync.call(clearFun);
};

// 添加一些事件、初始化页面
bind({
    ui_search: i18n("newtab_search")
}, document);

$search.addEventListener("keyup", e => {
    if (e.keyCode !== 13) {
        return;
    }
    let searchingKey = $search.value;
    search(searchingKey);
});

const itemClickFun = (e, div) => {
    let key = parseInt(div.id.replace("item-", ""));
    if (!contentMap.has(key)) {
        return true;
    }
    let info = contentMap.get(key);
    if (e.target.className === "bookmark-add") {
        addToMarkbook(info, e.target)
    } else if (e.target.className === "bookmark") {
        removeMarkbook(info, e.target)
    } else if (e.target.className === "btn item-btn") {
        removeHistory(info, div)
    }
};

const groupClickFun = (e, div) => {
    let groupName = div.getAttribute("data-groupname");
    let _div = div;
    let storeKey = getGroupStoreKey(groupName);
    if (e.target.className === "btn group-btn") {
        $(".tool-group-div", div)[0].style.display = "block";
        return true
    } else if (e.target.className === "btn group-delete") {
        removeSiteHistory(groupName, div)
    } else if (e.target.className === "btn group-nohistory") {
        if (!confirm(i18n("group_nohistory"))) {
            return true;
        }
        let _sync = setStore(storeKey, {nohistory: true, name: groupName, time: Date.now()});
        _sync.end = () => {
            if (_sync.err) {
                showInfo(_sync.err)
            } else {
                removeSiteHistory(groupName, _div)
            }
        }
    } else if (e.target.className === "btn group-black") {
        if (!confirm(i18n("group_black"))) {
            return true
        }
        let _sync = setStore(storeKey, {disable: true, nohistory: true, name: groupName, time: Date.now()});
        _sync.end = () => {
            if (_sync.err) {
                showInfo(_sync.err)
            } else {
                removeSiteHistory(groupName, _div)
            }
        }
    }
};

$contentDiv.addEventListener("click", e => {
    $(".tool-group-div").forEach(dom => {
        dom.style.display = ""
    });
    let div = e.target;
    while (div) {
        if (div.className === "content-item") {
            if (itemClickFun(e, div)) {
                return
            }
        } else if (div.className === "content-group" || div.className === "content-group large-group") {
            if (groupClickFun(e, div)) {
                return
            }
        } else if (div.className === "showmore") {
            div.parentElement.className = "content-group"
        }
        div = div.parentElement;
    }
});

search("");

$search.focus();

$(".setting-btn")[0].addEventListener("click", () => {
    location.href = "/page/setting/_.html"
});