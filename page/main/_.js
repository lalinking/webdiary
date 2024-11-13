if (location.search != "?from=act") {
  document.title = i18n("main_name");
  $("html, body").forEach(e => {
    e.style = "width: calc(100% - 1px); height: calc(100% - 1px);"
  })
}
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
  }, 100);
};
let resListSize = 50;

const faviconURL = (url) => {
  const _url = new URL(chrome.runtime.getURL("/_favicon/"));
  _url.searchParams.set("pageUrl", url);
  _url.searchParams.set("size", "32");
  return _url.toString();
}
const appendResult = (info) => {
  let groupDivID = "group-" + info.group.hashCode();
  let $group = $("#" + groupDivID, $contentDiv);
  if ($group.length > 0) {
    $group = $group[0];
  } else {
    let groupIncognitoBtn = `<img class="btn" name="btn_sites_ac_incognito" src="/resource/incognito.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupIncognitoNoBtn = `<img class="btn" name="btn_sites_incognito" src="/resource/incognito-no.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupDeleteBtn = `<img class="btn" name="btn_sites_delete" src="/resource/delete.png" title="${i18n("msg_sites_delete")}" />`;
    let groupRemarkBtn = `<img class="btn" name="btn_sites_remark" src="/resource/remark.png" title="${i18n("msg_sites_remark")}" />`;
    let favicon = `<img class="favicon" src="${faviconURL(info.url)}"/>`;
    let groupTool = `<div class="tool-group-div">${groupIncognitoBtn}${groupIncognitoNoBtn}${groupDeleteBtn}${groupRemarkBtn}</div>`;
    $group = createNode(`<div class="content-group" name="group" data-groupname="${info.group}" id="${groupDivID}">${favicon}<span class="text-ellipsis">${info.group}</span>${groupTool}<div name='remark'></div></div>`);
    $contentDiv.appendChild($group);
    let key = getGroupStoreKey(info.group);
    chrome.storage.local.get(key, res => {
      let g = res[key];
      if (!g)
        return;
      if (g.rm) {
        $group.setAttribute("data-rm", "true");
        $group.setAttribute("title", i18n("msg_sites_incognito"));
      }
      if (g.hd) {
        $group.setAttribute("data-hd", "true");
        $group.setAttribute("title", i18n("msg_sites_incognito"));
      }
      if (g.remark)
        $("[name=remark]", $group)[0].innerHTML = g.remark;
    })
  }
  setBrowseInfo(info, () => {
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
    let countAndDate = `<span class="content-item-visitcount ">${info.visitCount}</span><span class="content-item-date">${info.lastVisitTime}</span>`;
    let detail = `<div class="content-item-detail"><div class="text-ellipsis">${info.title}<br>${info.url}</div></div>`;
    let itemA = `<a target="_blank" href="${info.url}">${detail}<span class="text-ellipsis">${info.title}</span></a>`;
    let item = createNode(`<div class="content-item" name="item" id="item-${number}">${bookmark}${countAndDate}${itemA}<img class="btn item-btn" name="rm_history" src="/resource/delete-x.png" /></div>`);
    $group.appendChild(item);
    if ($group.children.length > 14) {
      item.className += " content-item-more";
	  if ($group.className == "content-group") {
  	    $group.className += " large-group";
        $group.appendChild(createNode(`<div class="showmore" name="more"><a href="javascript:">${i18n("ui_showmore")}</a></div>`))
	  }
    }
  })
};
const setBrowseInfo = (info, callback) => {
  if (!info.fromBookmark) {
    chrome.bookmarks.search(info.url, res2 => {
      if (res2.length > 0) {
        info.fromBookmark = true;
        info.title = res2[0].title;
        info.bookMarkID = res2[0].id;
      }
      callback(info)
    })
  } else if (info.visitCount == undefined) {
     chrome.history.getVisits({
       url: info.url
     }, res2 => {
       info.visitCount = res2.length;
       let lastVisitTime = 0;
       res2.forEach(v => {
         lastVisitTime = Math.max(v.visitTime, lastVisitTime);
       });
       if (lastVisitTime) {
         info.lastVisitTime = lastVisitTime
       }
       callback(info)
     })
  } else {
   callback(info)
  }
};

const search = () => {
  contentMap.clear();
  let async = new Async();
  let val = $search.value;
  let warnSize = resListSize;
  if (val) {
    async.call(() => {
      chrome.bookmarks.search(val, res1 => {
        res1.forEach(r => {
          let _url = r.url;
          if (!_url)
            return;
          let key = "g" + _url.replace(/^https/, "http").hashCode();
          r.group = getUrlGroupName(_url);
          r.fromBookmark = true;
          r.bookMarkID = r.id;
          contentMap.set(key, r);
          warnSize ++;
        });
        async.next()
      })
    });
  }
  async.call(() => {
    chrome.history.search({
      text: val,
      startTime: 0,
      endTime: Date.now(),
      maxResults: resListSize
    }, res1 => {
      if (res1.length >= resListSize) {warnSize = 0}
      res1.forEach(r => {
        r.group = r.group || getUrlGroupName(r.url);
        let key = "g" + r.url.replace(/^https/, "http").hashCode();
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
    $contentDiv.innerHTML = "";
    if (val && contentMap.size >= warnSize) {
      showInfo(i18n("msg_more"))
    } else if (contentMap.size === 0) {
      return showInfo(i18n("msg_nores"))
    }
    contentMap.forEach(appendResult);
  }
};
const addToMarkbook = (info, target) => {
  let _title = prompt(i18n("btn-addbookmark"), info.title);
  if (_title) {
    chrome.bookmarks.create({
      url: info.url,
      title: _title
    }, res => {
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
const setSiteIncognito = (groupName, groupDiv, ifrm) => {
  let key = getGroupStoreKey(groupName);
  chrome.storage.local.get(key, res => {
    let _obj = res[key] || {
      name: groupName,
      remark: ""
    };
    _obj.key = key;
    _obj.rm = ifrm ? true : undefined;
    _obj.time = _obj.time || new Date().format("yyyy-MM-dd HH:mm:ss");
    let _store = {};
    _store[key] = _obj;
    chrome.storage.local.set(_store, () => {
      if (chrome.runtime.lastError) {
        alert(i18n("msg_err") + chrome.runtime.lastError.message)
      } else {
        groupDiv.setAttribute("data-rm", ifrm ? "true" : "false");
      }
    })
  })
};
const setSiteHide = (groupName, groupDiv, ifhd) => {
  let key = getGroupStoreKey(groupName);
  chrome.storage.local.get(key, res => {
    let _obj = res[key] || {
      name: groupName,
      remark: ""
    };
    _obj.key = key;
    _obj.hd = ifhd ? true : undefined;
    _obj.time = _obj.time || new Date().format("yyyy-MM-dd HH:mm:ss");
    let _store = {};
    _store[key] = _obj;
    chrome.storage.local.set(_store, () => {
      if (chrome.runtime.lastError) {
        alert(i18n("msg_err") + chrome.runtime.lastError.message)
      } else {
        groupDiv.setAttribute("data-hd", ifhd ? "true" : "false");
      }
    })
  })
};
const removeHistory = (info, itemDiv) => {
  chrome.history.deleteUrl({
    url: info.url
  }, () => {
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
            chrome.history.deleteUrl({
              url: _r.url
            }, () => {
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
const setSiteRemark = (groupName, groupDiv) => {
  if ($(".remark_editor", groupDiv).length > 0) {
    return;
  }
  let _remark = "";
  let _remarkDiv = $("[name='remark']", groupDiv)[0];
  _remark = _remarkDiv.innerText;
  _remarkDiv.className = "hide";
  let _remarkArea = document.createElement("textarea");
  _remarkArea.className = "remark_editor";
  _remarkArea.value = _remark;
  groupDiv.insertBefore(_remarkArea, groupDiv.children[2]);
  _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  _remarkArea.addEventListener("input", e => {
    _remarkArea.style.height = 'auto';
    _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  });
  _remarkArea.addEventListener("blur", e => {
    let key = getGroupStoreKey(groupName);
    chrome.storage.local.get(key, res => {
      let _obj = res[key] || {
        name: groupName,
        remark: ""
      };
      _obj.key = key;
      _obj.remark = _remarkArea.value ? _remarkArea.value : undefined;
      _obj.time = _obj.time || new Date().format("yyyy-MM-dd HH:mm:ss");
      let _store = {};
      _store[key] = _obj;
      chrome.storage.local.set(_store, () => {
        if (chrome.runtime.lastError) {
          alert(i18n("msg_err") + chrome.runtime.lastError.message)
        } else {
          _remarkDiv.innerHTML = _remarkArea.value;
          _remarkDiv.className = "";
          _remarkArea.remove();
          showInfo(i18n("msg_succeed"));
        }
      })
    });
  });
  _remarkArea.focus();
};
// 添加一些事件、初始化页面
bind({
  ui_search: i18n("ui_search_placehold"),
  ui_sites_incognito_mode: i18n("ui_sites_incognito")
}, document);
let searchTimeout;
$search.addEventListener("keyup", e => {
  if (e.keyCode < 65 && e.keyCode != 13 && e.keyCode != 8 && e.keyCode != 46)
    return;
  clearTimeout(searchTimeout);
  if (e.keyCode == 13) {
    if (e.altKey && $search.value) {
      chrome.tabs.create({
        url: "https://www.google.com/search?q=" + $search.value
      })
    } else {
      search();
    }
  } else {
    if ($search.value)
      searchTimeout = setTimeout(search, 600)
  }
});
const itemClickFun = (e, div) => {
  let key = "g" + parseInt(div.id.replace("item-", ""));
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
  } else if (name === "btn_sites_remark") {
    setSiteRemark(groupName, div);
  } else if (name === "btn_sites_ac_incognito") {
    setSiteIncognito(groupName, div, false);
  } else if (name === "btn_sites_incognito") {
    setSiteIncognito(groupName, div, true);
  } else if (name === "btn_sites_ac_hide") {
    setSiteHide(groupName, div, false);
  } else if (name === "btn_sites_hide") {
    setSiteHide(groupName, div, true);
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
  location.href = "/page/setting/page.html" + location.search
});
document.addEventListener("keydown", e => {
  console.log(e);
  if (e.target.tagName == "TEXTAREA" || (e.target.tagName == "INPUT" && e.keyCode == 13) || e.keyCode == 16) return;
  if (e.keyCode !== 38 && e.keyCode !== 40 && e.keyCode !== 13 && e.keyCode !== 9) return $search.focus();
  clearTimeout(searchTimeout);
  let aList = [].slice.call($(".content-group:not(.large-group) div:not(.showmore) a, .content-group.large-group div:not(.content-item-more) a"));
  if (aList.length == 0) return;
  let currentA = $("a:focus");
  if (e.keyCode == 38 || e.keyCode == 40) { // 上下
    let currentIndex;
    if (currentA.length == 1) {
      for (let index = 0; index < aList.length; index++) {
        let a = aList[index];
        if (a == currentA[0]) {
          currentIndex = index;
          break
        }
      }
    } else {
      currentIndex = -1
    }
    if (e.keyCode == 38) currentIndex = currentIndex < 1 ? aList.length - 1 : currentIndex - 1;
    if (e.keyCode == 40) currentIndex = currentIndex > aList.length - 2 ? 0 : currentIndex + 1;
    currentA = aList[currentIndex];
  } else if (e.keyCode == 9) { // tab
    let gList = [].slice.call($(".content-div .content-group"));
    let currentGroupIndex;
    if (currentA.length == 1) {
      let currentGroup = currentA[0].parentElement.parentElement;
      for (let index = 0; index < gList.length; index++) {
        let g = gList[index];
        if (g == currentGroup) {
          currentGroupIndex = index;
          break
        }
      }
      if (e.shiftKey) {
        currentGroupIndex = currentGroupIndex < 1 ? gList.length - 1 : currentGroupIndex - 1;
      } else {
        currentGroupIndex = currentGroupIndex > gList.length - 2 ? 0 : currentGroupIndex + 1;
      }
    } else {
      if (e.shiftKey) {
        currentGroupIndex = gList.length - 1;
      } else {
        currentGroupIndex = 0;
      }
    }
    currentA = $("a", gList[currentGroupIndex])[0];
  }
  if (e.keyCode != 13) {
    event.preventDefault();
    currentA.focus()
  }
});

$search.focus();
chrome.storage.local.get("setting_list_size", res => {
  let _size = res["setting_list_size"];
  if (_size) {
    resListSize = parseInt(_size) || 50;
  }
  setTimeout(search, 50);
});
