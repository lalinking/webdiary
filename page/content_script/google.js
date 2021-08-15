const google = true;
$("#search div.g").forEach(g => {
  g.className += " wd_search_res"
  let url = $("cite", g)[0].firstChild.textContent;
  let groupName = getUrlGroupName(url);
  let key = getGroupStoreKey(groupName);
  // 加入工具条
  let groupHideBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_ac_hide" src="${chrome.extension.getURL('/resource/hide.png')}" title="${i18n("main_name")}: ${i18n("msg_sites_hide")}" />`;
  let groupHideNoBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_hide" src="${chrome.extension.getURL('/resource/hide-no.png')}" title="${i18n("main_name")}: ${i18n("msg_sites_hide")}" />`;
  let groupIncognitoBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_ac_incognito" src="${chrome.extension.getURL('/resource/incognito.png')}" title="${i18n("main_name")}: ${i18n("msg_sites_incognito")}" />`;
  let groupIncognitoNoBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_incognito" src="${chrome.extension.getURL('/resource/incognito-no.png')}" title="${i18n("main_name")}: ${i18n("msg_sites_incognito")}" />`;
  let groupRemarkBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_remark" src="${chrome.extension.getURL('/resource/remark.png')}" title="${i18n("main_name")}: ${i18n("msg_sites_remark")}" />`;
  let groupDeleteBtn = `<img oncontextmenu="return false;" ondragstart="return false;" name="btn_sites_delete" src="${chrome.extension.getURL('/resource/delete-x.png')}" />`;
  let groupTitle = `<div class="wd_search_res_upgrade_title">${i18n("main_name")}</div>`;
  let nod = document.createElement("div");
  nod.className = "wd_search_res_upgrade";
  nod.appendChild(createNode(`<div class="wd_search_res_upgrade_tips" style="min-height: ${g.offsetHeight}px;height: ${g.offsetHeight}px;">${groupTitle}<div class="wd_search_res_upgrade_remark"></div></div>`));
  nod.appendChild(createNode(`<div class="wd_search_res_upgrade_tool" ondragstart="return false;" data-key="${key}" data-gpname="${groupName}">${groupHideBtn}${groupHideNoBtn}${groupIncognitoBtn}${groupIncognitoNoBtn}${groupRemarkBtn}${groupDeleteBtn}</div>`));
  g.insertBefore(nod, g.firstChild);
  chrome.storage.local.get(key, res => {
    let data = res[key];
    if (!data)
      return;
    g.className += ` ${data.rm ? " wd_search_res_rm" : ""}${data.hd ? " wd_search_res_hd" : ""}${data.remark && data.remark.length ? " wd_search_res_rmk" : ""}`;
    if (data.remark) {
      $(".wd_search_res_upgrade_remark", g)[0].innerHTML = data.remark;
    }
    if (data.time) {
      $(".wd_search_res_upgrade_title", g)[0].innerText += ": " + new Date(data.time).format("yyyy-MM-dd");
    }
  })
});
const setSiteIncognito = (key, groupName, groupDiv, ifrm) => {
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
        groupDiv.parentElement.className = `g wd_search_res ${_obj.rm ? " wd_search_res_rm" : ""}${_obj.hd ? " wd_search_res_hd" : ""}${_obj.remark && _obj.remark.length ? " wd_search_res_rmk" : ""}`
      }
    })
  })
};
const setSiteHide = (key, groupName, groupDiv, ifhd) => {
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
        groupDiv.parentElement.className = `g wd_search_res ${_obj.rm ? " wd_search_res_rm" : ""}${_obj.hd ? " wd_search_res_hd" : ""}${_obj.remark && _obj.remark.length ? " wd_search_res_rmk" : ""}`
      }
    })
  })
};
const setSiteRemark = (key, groupName, groupDiv) => {
  if ($(".wd_search_res_upgrade_remarkeditor", groupDiv).length > 0) {
    return;
  }
  groupDiv.parentElement.className += " wd_search_res_rmk";
  let _remark = $(".wd_search_res_upgrade_remark", groupDiv)[0].innerHTML;
  let _remarkArea = document.createElement("textarea");
  _remarkArea.className = "wd_search_res_upgrade_remarkeditor";
  _remarkArea.value = _remark;
  groupDiv.className = "wd_search_res_upgrade editing";
  $(".wd_search_res_upgrade_tips", groupDiv)[0].appendChild(_remarkArea);
  // groupDiv.appendChild(_remarkArea);
  _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  _remarkArea.addEventListener("input", e => {
    _remarkArea.style.height = 'auto';
    _remarkArea.style.height = _remarkArea.scrollHeight + "px";
  });
  _remarkArea.addEventListener("blur", e => {
    groupDiv.className = "wd_search_res_upgrade";
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
          $(".wd_search_res_upgrade_remark", groupDiv)[0].innerHTML = _remarkArea.value;
          _remarkArea.remove();
          groupDiv.parentElement.className = `g wd_search_res ${_obj.rm ? " wd_search_res_rm" : ""}${_obj.hd ? " wd_search_res_hd" : ""}${_obj.remark && _obj.remark.length ? " wd_search_res_rmk" : ""}`
        }
      })
    });
  });
  _remarkArea.focus();
};
$("#search")[0].addEventListener("click", e => {
  let target = e.target;
  let div = target.parentElement;
  let name = target.getAttribute("name");
  let _key = div.getAttribute("data-key");
  let _groupName = div.getAttribute("data-gpname");
  if (name === "btn_sites_delete") {
    chrome.storage.local.remove(_key, () => {
      if (chrome.runtime.lastError) {
        alert(i18n("msg_err") + chrome.runtime.lastError.message);
      } else {
        div.parentElement.parentElement.className = "g wd_search_res";
      }
    })
  } else if (name === "btn_sites_remark") {
    setSiteRemark(_key, _groupName, div.parentElement);
  } else if (name === "btn_sites_ac_incognito") {
    setSiteIncognito(_key, _groupName, div.parentElement, false);
  } else if (name === "btn_sites_incognito") {
    setSiteIncognito(_key, _groupName, div.parentElement, true);
  } else if (name === "btn_sites_ac_hide") {
    setSiteHide(_key, _groupName, div.parentElement, false);
  } else if (name === "btn_sites_hide") {
    setSiteHide(_key, _groupName, div.parentElement, true);
  }
})
