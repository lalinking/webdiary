const google = true;
const setResClass = (resDiv, data) => {
  let cls = resDiv.className || "";
  if (data.rm && cls.indexOf(" wd_search_res_rm ") < 0) {cls += " wd_search_res_rm "} else if (!data.rm) {cls = cls.replace(" wd_search_res_rm ", " ")}
  if (data.hd && cls.indexOf(" wd_search_res_hd ") < 0) {cls += " wd_search_res_hd "} else if (!data.hd) {cls = cls.replace(" wd_search_res_hd ", " ")}
  if (data.remark && cls.indexOf(" wd_search_res_rmk ") < 0) {cls += " wd_search_res_rmk "} else if (!data.remark) {cls = cls.replace(" wd_search_res_rmk ", " ")}
  resDiv.className = cls
};
const upgradeFun = g => {
  g.className += " wd_search_res"
  let url = $("a", g)[0].getAttribute("href");
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
  nod.style.width = g.offsetWidth + "px";
  nod.appendChild(createNode(`<div class="wd_search_res_upgrade_tool" ondragstart="return false;" data-key="${key}" data-gpname="${groupName}">${groupHideBtn}${groupHideNoBtn}${groupIncognitoBtn}${groupIncognitoNoBtn}${groupRemarkBtn}${groupDeleteBtn}</div>`));
  nod.appendChild(createNode(`<div class="wd_search_res_upgrade_tips">${groupTitle}<div class="wd_search_res_upgrade_remark"></div></div>`));
  g.insertBefore(nod, g.firstChild);
  chrome.storage.local.get(key, res => {
    let data = res[key];
    if (!data)
      return;
    setResClass(g, data);
    if (data.remark) {
      $(".wd_search_res_upgrade_remark", g)[0].innerHTML = data.remark;
    }
    if (data.time) {
      $(".wd_search_res_upgrade_title", g)[0].innerText += ": " + new Date(data.time).format("yyyy-MM-dd");
    }
 })
};
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
        setResClass(groupDiv.parentElement, _obj);
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
        setResClass(groupDiv.parentElement, _obj);
      }
    })
  })
};
const setSiteRemark = (key, groupName, groupDiv) => {
  if ($(".wd_search_res_upgrade_remarkeditor", groupDiv).length > 0) {
    return;
  }
  if (groupDiv.parentElement.className.indexOf(" wd_search_res_rmk ") < 0) {
    groupDiv.parentElement.className += " wd_search_res_rmk ";
  }
  let _remark = $(".wd_search_res_upgrade_remark", groupDiv)[0].innerHTML;
  let _remarkArea = document.createElement("textarea");
  _remarkArea.className = "wd_search_res_upgrade_remarkeditor";
  _remarkArea.value = _remark;
  groupDiv.className = "wd_search_res_upgrade editing";
  $(".wd_search_res_upgrade_tips", groupDiv)[0].appendChild(_remarkArea);
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
      _obj.remark = _remarkArea.value && _remarkArea.value.trim().length ? _remarkArea.value : undefined;
      _obj.time = _obj.time || new Date().format("yyyy-MM-dd HH:mm:ss");
      let _store = {};
      _store[key] = _obj;
      chrome.storage.local.set(_store, () => {
        if (chrome.runtime.lastError) {
          alert(i18n("msg_err") + chrome.runtime.lastError.message)
        } else {
          $(".wd_search_res_upgrade_remark", groupDiv)[0].innerHTML = _remarkArea.value;
          _remarkArea.remove();
          setResClass(groupDiv.parentElement, _obj);
        }
      })
    });
  });
  _remarkArea.focus();
};
window.addEventListener("click", e => {
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
});
$("#search div.g").forEach(upgradeFun);
$("#rso g-card").forEach(upgradeFun);
