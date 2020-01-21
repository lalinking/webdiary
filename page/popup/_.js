chrome.tabs.query({active: true}, tabs => {
    let url = tabs[0].url;
    if (!url) {
        window.close()
    }
    let groupName = getUrlGroupName(tabs[0].url);
    let storeKey = getGroupStoreKey(groupName);
    let btn3 = $("#btn_remove")[0];
    chrome.storage.sync.get(storeKey, res => {
        let re = res[storeKey];
        let btn1 = $("#btn_nohistory")[0];
        if (re && re.nohistory) {
            btn1.parentElement.appendChild(createNode("<span>√ </span>"));
            btn3.parentElement.className = "btn-div3"
        }
        btn1.addEventListener("click", () => {
            let _sync = setStore(storeKey, {nohistory: true, name: groupName, time: Date.now()});
            _sync.end = () => {
                if (_sync.err) {
                    alert(_sync.err)
                } else {
                    window.close()
                }
            }
        });
        let btn2 = $("#btn_black")[0];
        if (re && re.disable) {
            if (re && re.disable) {
                btn2.parentElement.appendChild(createNode("<span>√ </span>"));
                btn3.parentElement.className = "btn-div3"
            }
        }
        btn2.addEventListener("click", () => {
            let _sync = setStore(storeKey, {disable: true, nohistory: true, name: groupName, time: Date.now()})
            _sync.end = () => {
                if (_sync.err) {
                    alert(_sync.err)
                } else {
                    window.close()
                }
            }
        });
    });
    btn3.addEventListener("click", () => {
        chrome.storage.sync.remove(storeKey, window.close)
    })
});

bind({
    ui_btn_nohistory: i18n("group_nohistory"),
    ui_btn_black: i18n("group_black"),
    ui_btn_remove: i18n("btn_remove")
}, document);