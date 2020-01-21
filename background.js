console.log("backgroud.js start");
String.prototype.hashCode = function () {
    let hash = 5381;
    for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) + hash) + this.charCodeAt(i);
    }
    return hash;
};

chrome.storage.sync.get(null, loadDataSucceed);

function loadDataSucceed(data) {
    console.log("load data succeed: ");
    console.log(data.size);
    chrome.history.onVisited.addListener(info => {
        let groupName = info.url.replace(/^[^:]+:\/*([^/]+(.[^/])*?)\/.*$/, "$1");
        let hashCode = groupName.hashCode();
        let storeKey = hashCode > 0 ? ("g" + hashCode) : ("h" + Math.abs(hashCode));
        let datum = data[storeKey];
        if (datum && datum.nohistory) {
            chrome.history.deleteUrl({url: info.url}, () => {
                console.log("remove url: " + info.url)
            })
        }
    });

    chrome.storage.onChanged.addListener(info => {
        for (let key in info) {
            if (key === "size") {
                continue
            }
            data[key] = info[key].newValue
        }
        chrome.storage.sync.set({size: Object.keys(data).length - 1})
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (!tab.url || changeInfo.status !== "loading") {
            return
        }
        chrome.tabs.executeScript(tabId, {file: "/resource/upgrade.js", runAt: "document_start"});
        chrome.tabs.insertCSS(tabId, {file: "/page/google/_.css", runAt: "document_start"});
        chrome.tabs.executeScript(tabId, {file: "/page/google/_.js", runAt: "document_end"});
    });
}