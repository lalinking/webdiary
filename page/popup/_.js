$("#btn_nohistory")[0].addEventListener("click", e => {
    chrome.tabs.query({active: true}, tabs => {
        if (!tabs[0].url) {
            return
        }
        let groupName = getUrlGroupName(tabs[0].url);
        let storeKey = getGroupStoreKey(groupName);
        let _sync = new Sync();
        _sync.end = () => {
            window.close()
        };
        _sync.call(() => {
            chrome.storage.sync.get("size", res => {
                if (!res.size || res.size < 500) {
                    _sync.next()
                } else {
                    alert(i18n("msg_toomuch"));
                    _sync.interrupt()
                }
            })
        }).call(() => {
            let storeValue = {};
            storeValue[storeKey] = {nohistory: true, name: groupName, time: Date.now()};
            chrome.storage.sync.set(storeValue, _sync.next);
        });
    });
});

$("#btn_black")[0].addEventListener("click", e => {
    chrome.tabs.query({active: true}, tabs => {
        if (!tabs[0].url) {
            return
        }
        let groupName = getUrlGroupName(tabs[0].url);
        let storeKey = getGroupStoreKey(groupName);
        let _sync = new Sync();
        _sync.end = () => {
            window.close()
        };
        _sync.call(() => {
            chrome.storage.sync.get("size", res => {
                if (!res.size || res.size < 500) {
                    _sync.next()
                } else {
                    alert(i18n("msg_toomuch"));
                    _sync.interrupt()
                }
            })
        }).call(() => {
            chrome.permissions.contains({
                origins: ['https://www.google.com/']
            }, res => {
                if (res) {
                    _sync.ignoreNext()
                }
                _sync.next()
            });
        }).call(() => {
            chrome.permissions.request({
                origins: ['https://www.google.com/']
            }, granted => {
                if (!granted) {
                    showInfo(i18n("msg_cancel"));
                    _sync.interrupt()
                } else {
                    _sync.next()
                }
            });
        }).call(() => {
            let storeValue = {};
            storeValue[storeKey] = {nohistory: true, disable: true, name: groupName, time: Date.now()};
            chrome.storage.sync.set(storeValue, _sync.next)
        });
    });
});


bind({
    ui_btn_nohistory: i18n("group_nohistory"),
    ui_btn_black: i18n("group_black")
}, document);