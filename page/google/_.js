const findG = a => {
    let g = a;
    while (g && g.className !== "g") {
        g = g.parentElement
    }
    return g
};

$(".g .r a").forEach(a => {
    let groupName = getUrlGroupName(a.getAttribute("href"));
    let storeKey = getGroupStoreKey(groupName);

    chrome.storage.sync.get(storeKey, res => {
        if (res[storeKey] && res[storeKey].disable) {
            let g = findG(a);
            g.className += " _web_diary_disabled_g";
            let title = createNode(`<div class="_web_diary_disabled_title">${i18n("google_disable_msg")}</div>`);
            let btn = createNode(`<button class="_web_diary_disabled_btn" data-storekey="${storeKey}">×</button>`);
            g.insertBefore(title, g.children[0]);
            g.insertBefore(btn, g.children[0]);
            btn.addEventListener("click", e => {
                let sk = e.target.getAttribute("data-storekey");
                chrome.storage.sync.remove(sk, () => {
                    g.className = "g"
                });
            })
        }
    });
});

