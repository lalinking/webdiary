$("#search div.g").forEach(g => {
    let url = $("a[jsname=ajHxCd]" ,g)[0].getAttribute("href");
    let key = getGroupStoreKey(getUrlGroupName(url));
    chrome.storage.local.get(key, res => {
        let data = res[key];
        if (!data) return;
        let html = "<div class='wd_row' style='left:50em;height:7.6em;'>";
        html += `<div class="wd_time">${new Date(data.time).format("yyyy-MM-dd HH:mm:ss")} &nbsp;&nbsp; ${data.rm ? i18n("ui_sites_incognito") : ""}</div>`;
        html += `<div class="wd_remark">${data.remark}</div>`;
        html += "</div>";
        g.insertBefore(createNode(html), g.firstChild)
    })
})