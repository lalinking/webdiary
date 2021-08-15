if (location.search == "?from=opt") {
  $("html, body").forEach(e => {
    e.style = "width: calc(100% - 1px); height: calc(100% - 1px);"
  })
}

let $SetPanel = $("#authorization")[0];
let $ListPanel = $("#sites")[0];

chrome.storage.local.get("setting_urls", res => {
  let urls = res["setting_urls"] || ["https://www.google.com/", "https://bing.com/"];
  urls.forEach((url, _index) => {
    let _url = url;
    chrome.permissions.contains({
      origins: [_url]
    }, active => {
      let imgDom = `<img class="item-img favicon" src="chrome://favicon/${_url}"/>`;
      let textDom = `<input class="item-url text-ellipsis" value="${_url}"/>`;
      let btnDom = `<input name="btn_authorization_active" class="item-btn btn" type="checkbox" ${active ? "checked" : "data-inactive"}/>`;
      let item = createNode(`<div class="item">${imgDom}${textDom}${btnDom}</div>`);
      $SetPanel.appendChild(item)
      $(".item-url", item)[0].addEventListener("change", e => {
        urls[_index] = e.target.value;
        chrome.storage.local.set({
          setting_urls: urls
        });
        chrome.permissions.contains({
          origins: [e.target.value]
        }, _act => {
          let _ck = $("[name=btn_authorization_active]", item)[0];
          if (_act) {
            _ck.setAttribute("checked", "");
          } else {
            _ck.removeAttribute("checked");
          }
        });
      });
    });
  })
});
chrome.storage.local.get("setting_searchpage_upgrade", res => {
  let upgrade = res["setting_searchpage_upgrade"];
  if (upgrade) {
    document.body.className = "searchpage_upgrade";
    $("[name=btn_searchpage_upgrade]")[0].checked = true
  }
});
chrome.storage.local.get(null, datas => {
  let hasRes = false;
  for (let key in datas) {
    if (key == "version" || key.startsWith("setting_")) {
      continue
    }
    let data = datas[key];
    let time;
    if (data.time) {
      time = new Date(data.time).format("yyyy-MM-dd")
    } else {
      time = ""
    }
    let imgDom = `<img class="item-img favicon" src="chrome://favicon/http://${data.name}/"/>`;
    let groupHideBtn = `<img class="btn item-btn page_upgrade" data-key="${key}" name="btn_sites_ac_hide" src="/resource/hide.png" title="${i18n("msg_sites_hide")}" />`;
    let groupHideNoBtn = `<img class="btn item-btn page_upgrade" data-key="${key}" name="btn_sites_hide" src="/resource/hide-no.png" title="${i18n("msg_sites_hide")}" />`;
    let groupIncognitoBtn = `<img class="btn item-btn" data-key="${key}" name="btn_sites_ac_incognito" src="/resource/incognito.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupIncognitoNoBtn = `<img class="btn item-btn" data-key="${key}" name="btn_sites_incognito" src="/resource/incognito-no.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupRemarkBtn = `<img class="btn item-btn ${data.remark && data.remark.length ? "has-remark" : ""}" data-key="${key}" name="btn_sites_remark" src="/resource/remark.png" title="${i18n("msg_sites_remark")}" />`;
    let textDom = `<div class="item-name text-ellipsis">${time}&nbsp;&nbsp;&nbsp;${data.name}</div>`;
    let groupDeleteBtn = `<img class="item-btn btn" name="btn_sites_delete" data-key="${key}" src="/resource/delete-x.png" />`;
    let item = createNode(`<div data-rm="${data.rm}" data-hd="${data.hd}" class="item" title="${data.remark}">${imgDom}${textDom}${groupHideBtn}${groupHideNoBtn}${groupIncognitoBtn}${groupIncognitoNoBtn}${groupRemarkBtn}${groupDeleteBtn}</div>`);
    hasRes = true;
    $ListPanel.appendChild(item)
  }
  if (!hasRes) {
    $ListPanel.appendChild(createNode(`<div class="textcontent">${i18n("msg_nores")}</div>`))
  }
});

const setSiteIncognito = (key, groupDiv, ifrm) => {
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
const setSiteHide = (key, groupDiv, ifhd) => {
  chrome.storage.local.get(key, res => {
    let _obj = res[key];
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
const setSiteRemark = (key, groupDiv) => {
  if ($(".remark_editor", groupDiv).length > 0) {
    return;
  }
  let _remark = groupDiv.getAttribute("title");
  let _remarkArea = document.createElement("textarea");
  _remarkArea.className = "remark_editor";
  _remarkArea.value = _remark;
  groupDiv.insertBefore(_remarkArea, groupDiv.children[8]);
  _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  _remarkArea.addEventListener("input", e => {
    _remarkArea.style.height = 'auto';
    _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  });
  _remarkArea.addEventListener("blur", e => {
    chrome.storage.local.get(key, res => {
      let _obj = res[key];
      _obj.key = key;
      _obj.remark = _remarkArea.value ? _remarkArea.value : undefined;
      _obj.time = _obj.time || new Date().format("yyyy-MM-dd HH:mm:ss");
      let _store = {};
      _store[key] = _obj;
      chrome.storage.local.set(_store, () => {
        if (chrome.runtime.lastError) {
          alert(i18n("msg_err") + chrome.runtime.lastError.message)
        } else {
          groupDiv.setAttribute("title", _remarkArea.value);
          _remarkArea.remove();
        }
      })
    });
  });
  _remarkArea.focus();
};

document.body.addEventListener("click", e => {
  let target = e.target;
  let div = target.parentElement;
  let name = target.getAttribute("name");
  let _key = target.getAttribute("data-key");
  if (name === "btn_sites_delete") {
    chrome.storage.local.remove(_key, () => {
      if (chrome.runtime.lastError) {
        alert(i18n("msg_err") + chrome.runtime.lastError.message)
      } else {
        target.parentElement.remove()
      }
    })
  } else if (name === "btn_authorization_active") {
    if (target.checked) {
      chrome.permissions.request({
        origins: [$(".item-url", div)[0].value]
      }, granted => {
        if (!granted) {
          target.checked = false
        }
      });
    } else {
      chrome.permissions.remove({
        origins: [$(".item-url", div)[0].value]
      }, function (removed) {
        if (!removed) {
          target.checked = true
        }
      })
    }
  } else if (name === "btn_searchpage_upgrade") {
    let checked = $("[name=btn_searchpage_upgrade]")[0].checked;
    chrome.storage.local.set({
      setting_searchpage_upgrade: $("[name=btn_searchpage_upgrade]")[0].checked
    });
    document.body.className = checked ? "searchpage_upgrade" : "";
  } else if (name === "btn_sites_remark") {
    setSiteRemark(_key, div);
  } else if (name === "btn_sites_ac_incognito") {
    setSiteIncognito(_key, div, false);
  } else if (name === "btn_sites_incognito") {
    setSiteIncognito(_key, div, true);
  } else if (name === "btn_sites_ac_hide") {
    setSiteHide(_key, div, false);
  } else if (name === "btn_sites_hide") {
    setSiteHide(_key, div, true);
  }
});

bind({
  ui_title: i18n("ui_setting_title"),
  ui_searchpage_upgrade: i18n("ui_setting_searchpage_upgrade"),
  ui_authorization: i18n("ui_setting_authorization"),
  ui_authorization_tips: i18n("ui_setting_authorization_tips"),
  ui_sites: i18n("ui_setting_sites"),
  ui_sites_tips: i18n("ui_setting_sites_tips"),
  ui_about: i18n("ui_setting_about"),
  ui_about_content: i18n("ui_setting_about_content")
}, document);
