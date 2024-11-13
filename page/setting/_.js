if (location.search != "?from=act") {
  $("html, body").forEach(e => {
    e.style = "width: calc(100% - 1px); height: calc(100% - 1px);"
  })
}

let $ListPanel = $("#sites")[0];

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
const faviconURL = (url) => {
  const _url = new URL(chrome.runtime.getURL("/_favicon/"));
  _url.searchParams.set("pageUrl", url);
  _url.searchParams.set("size", "32");
  return _url.toString();
}

chrome.storage.local.get("setting_authorization_newtab", res => {
  if (res["setting_authorization_newtab"] != "true") return;
  $("input[name=btn_setting_authorization_newtab]")[0].checked = true;
});
chrome.storage.local.get("setting_authorization_history", res => {
  if (res["setting_authorization_history"] != "true") return;
  $("input[name=btn_setting_authorization_history]")[0].checked = true;
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
    let imgDom = `<img class="item-img favicon" src="${faviconURL(data.name)}/"/>`;
    let groupIncognitoBtn = `<img class="btn item-btn" data-key="${key}" name="btn_sites_ac_incognito" src="/resource/incognito.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupIncognitoNoBtn = `<img class="btn item-btn" data-key="${key}" name="btn_sites_incognito" src="/resource/incognito-no.png" title="${i18n("msg_sites_incognito")}" />`;
    let groupRemarkBtn = `<img class="btn item-btn ${data.remark && data.remark.length ? "has-remark" : ""}" data-key="${key}" name="btn_sites_remark" src="/resource/remark.png" title="${i18n("msg_sites_remark")}" />`;
    let textDom = `<div class="item-name text-ellipsis">${time}&nbsp;&nbsp;&nbsp;${data.name}</div>`;
    let groupDeleteBtn = `<img class="item-btn btn" name="btn_sites_delete" data-key="${key}" src="/resource/delete-x.png" />`;
    let item = createNode(`<div data-rm="${data.rm}" data-hd="${data.hd}" class="item" title="${data.remark}">${imgDom}${textDom}${groupIncognitoBtn}${groupIncognitoNoBtn}${groupRemarkBtn}${groupDeleteBtn}</div>`);
    hasRes = true;
    $ListPanel.appendChild(item)
  }
  if (!hasRes) {
    $ListPanel.appendChild(createNode(`<div class="textcontent">${i18n("msg_nores")}</div>`))
  }
});

document.body.addEventListener("click", e => {
  let target = e.target;
  let div = target.parentElement;
  let name = target.getAttribute("name");
  let _key = target.getAttribute("data-key");
  if (name === "btn_setting_authorization_newtab") {
    if (!target.checked) {
      chrome.storage.local.remove("setting_authorization_newtab");
      return;
    }
    chrome.runtime.getManifest().chrome_url_overrides= {newtab: "main/page.html"};
    chrome.runtime.restart();
  } else if (name === "btn_sites_delete") {
    chrome.storage.local.remove(_key)
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
  ui_setting_title: i18n("ui_setting_title"),
  ui_setting_hotkeys: i18n("ui_setting_hotkeys"),
  ui_setting_hotkeys_desc: i18n("ui_setting_hotkeys_desc"),
  ui_setting_sites: i18n("ui_setting_sites"),
  ui_setting_sites_tips: i18n("ui_setting_sites_tips"),
  ui_setting_general: i18n("ui_setting_general"),
  ui_setting_general_maxsize: i18n("ui_setting_general_maxsize"),
  ui_setting_about: i18n("ui_setting_about"),
  ui_setting_about_content: i18n("ui_setting_about_content")
}, document);

chrome.storage.local.get("setting_list_size", res => {
  let resListSize = 50;
  let _size = res["setting_list_size"];
  if (_size) {
    resListSize = parseInt(_size) || 50;
  }
  bind({value_setting_other_maxsize: resListSize})
});
$("input[name=value_setting_other_maxsize]")[0].addEventListener("change", e => {
	let _v = parseInt(e.target.value || 50);
	chrome.storage.local.set({setting_list_size: Math.max(_v, 50)});
});