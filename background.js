console.log("backgroud.js start");
importScripts("lib/pako.min.js", "upgrade.js");
// 解压
function unzip(b64Data) {
  let strData = atob(b64Data);
  const charData = strData.split('').map(function (x) {
    return x.charCodeAt(0);
  });
  const binData = new Uint8Array(charData);
  const data = pako.inflate(binData);
  strData = String.fromCharCode.apply(null, new Uint16Array(data));
  return decodeURIComponent(strData);
}

// 压缩
function zip(str) {
  const binaryString = pako.gzip(encodeURIComponent(str), {
    to: 'string'
  })
    return btoa(binaryString);
}

let syncVersion, localVersion;
let syncThread, syncTime = 0;

function loadVersion() {
  chrome.storage.sync.get("version", v => {
    syncVersion = v.version || 0;
    if (localVersion)
      return onLoadVersion();
    chrome.storage.local.get("version", v => {
      localVersion = v.version || 0;
      onLoadVersion()
    });
  });
}

function onLoadVersion() {
  console.log(`sync: ${syncVersion}, local: ${localVersion}`);
  if (syncVersion == 0 && localVersion == 0) {
    // 兼容设置，避免升级版本丢失数据
    let dataToLocal = {};
    chrome.storage.sync.get(null, _all => {
      for (let _p in _all) {
        let _d = _all[_p];
        dataToLocal[_p] = {
          name: _d.name,
          rm: true,
          remark: _d.disable ? "old black list" : "",
          time: _d.time
        }
      }
      dataToLocal.size = undefined;
      dataToLocal.version = 1;
      chrome.storage.local.set(dataToLocal)
    })
  }
  if (syncVersion > localVersion) {
    // 本地版本号小，需要拉取远程数据
    pull()
  }
}

function pull() {
  console.log(`start pull, sync: ${syncVersion}, local: ${localVersion}`);
  let str = "";
  chrome.storage.sync.get(null, _all => {
    for (let _i = 0; _i < (_all.size || 0); _i++) {
      str += _all["i" + _i];
    }
    localVersion = _all.version;
    let dataToLocal = JSON.parse(unzip(str));
    dataToLocal.version = _all.version;
    chrome.storage.local.clear(() => {
      chrome.storage.local.set(dataToLocal)
    })
  })
}

function push() {
  chrome.storage.local.get(null, _all => {
    console.log(`start push, sync: ${syncVersion}, local: ${localVersion}`);
    _all.version = undefined;
    let str = zip(JSON.stringify(_all));
    let dataToSync = {
      version: localVersion,
      size: Math.ceil(str.length / 8000)
    };

    for (let _l = 0; _l < dataToSync.size; _l++) {
      dataToSync["i" + _l] = str.substr(_l * 8000, 8000)
    }
    syncTime = Date.now();
    chrome.storage.sync.clear(() => {
      chrome.storage.sync.set(dataToSync)
    })
  })
}

chrome.storage.onChanged.addListener((info, area) => {
  if ("local" != area || info.version)
    return;
  localVersion++;
  clearTimeout(syncThread);
  chrome.storage.local.set({
    version: localVersion
  });
  if (Date.now() - syncTime < 60000) {
    // 同步间隔太小
    syncThread = setTimeout(push, 60000)
  } else {
    push()
  }
});

chrome.history.onVisited.addListener(info => {
  let storeKey = getGroupStoreKey(getUrlGroupName(info.url));
  chrome.storage.local.get(storeKey, res => {
    let datum = res[storeKey];
    if (datum && datum.rm) {
      chrome.history.deleteUrl({
        url: info.url
      }, () => {
        console.log("remove url: " + info.url)
      })
    }
  })
});

loadVersion();
// 每隔一段时间拉取一下远程的版本，防止覆盖
setInterval(loadVersion, 60000)
