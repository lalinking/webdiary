console.log("backgroud.js start");
importScripts("lib/pako.min.js", "upgrade.js");
// 解压
function unzip(remoteData) {
    let strData = atob(remoteData);
    let charData = strData.split('').map(function (x) { return x.charCodeAt(0) });
    let binData = new Uint8Array(charData);
    let data = pako.inflate(binData);
    strData = String.fromCharCode.apply(null, new Uint16Array(data));
    return decodeURIComponent(strData);
}

// 压缩
function zip(str) {
    let binaryString = pako.gzip(encodeURIComponent(str), {to: 'string'});
    return btoa(binaryString);
}

// 获取远端数据
function getRemoteData() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                // 此时获得的是压缩内容，需要解压
                let str = "";
                for (let _i = 0; _i < (result.size || 0); _i++) {
                    str += result["i" + _i];
                }
                if (!str.length) {return resolve({})}
                let dataToLocal = JSON.parse(unzip(str));
                resolve(dataToLocal);
            }
        });
    });
}

// 数据推送到远端
function pushData(data) {
    return new Promise((resolve, reject) => {
        let str = zip(JSON.stringify(data));
        let dataToSync = {
            version: Date.now(),
            size: Math.ceil(str.length / 8000)
        };
        for (let _l = 0; _l < dataToSync.size; _l++) {
            dataToSync["i" + _l] = str.substr(_l * 8000, 8000)
        }
        chrome.storage.sync.set(dataToSync, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

chrome.storage.onChanged.addListener((changes, area) => {
    console.log(`storage changed at ${area}: [${changes}]`);
    if (area == "local") {
        getRemoteData()
          .then(data => {
              for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                  data[key] = newValue;
              }
              return data;
          })
          .then(pushData)
          .then(() => {
              console.log("push 成功！");
          })
          .catch((error) => {
              console.error("push 出错: ", error);
          });
    } else if (area == "sync") {
        getRemoteData()
          .then(setLocalData)
          .then(() => {
              console.log("pull 成功！");
          })
          .catch((error) => {
              console.error("pull 出错: ", error);
          });
    }
});

// 根据配置自动删除历史记录
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


