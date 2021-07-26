if (location.search == "?from=opt") {
    $("html, body").forEach(e => {e.style = "width: calc(100% - 1px); height: calc(100% - 1px);"})
}

let $SetPanel = $(".content")[0];
let $ListPanel = $(".content")[1];

chrome.storage.local.get("urls", res => {
    let urls = res["urls"] || ["https://www.google.com/", "https://www.google.com.hk/", "https://cn.bing.com/"];
    urls.forEach(url => {
        let _url = url;
        chrome.permissions.contains({
            origins: [_url]
        }, active => {
            let imgDom = `<img class="item-img" src="${_url}/favicon.ico"/>`;
            let textDom = `<div class="item-name text-ellipsis">${_url}</div>`;
            let btnDom = `<input name="btn_active" data-url="${_url}" class="item-btn btn" type="checkbox" ${active ? "checked" : "data-inactive"}/>`;
            let item = createNode(`<div class="item">${imgDom}${textDom}${btnDom}</div>`);
            $SetPanel.appendChild(item)
        });
    })
});
chrome.storage.local.get(null, datas => {
    for (let key in datas) {
        if (key === "version") {
            continue
        }
        let data = datas[key];
        if (!data.rm) continue;
        let time;
        if (data.time) {
            time = new Date(data.time).format("yyyy-MM-dd")
        } else {
            time = ""
        }
        let imgDom = `<img class="item-img" src="chrome://favicon/size/48/http://${data.name}/"/>`;
        let textDom = `<div class="item-name text-ellipsis">${time}&nbsp;&nbsp;&nbsp;${data.name}</div>`;
        let btnDom = `<button name="btn_remove" class="item-btn btn" data-key="${key}">×</button>`;
        let item = createNode(`<div class="item" title="${data.remark}">${imgDom}${textDom}${btnDom}</div>`);
        $ListPanel.appendChild(item)
    }
    if (!$ListPanel.children.length) {
        $ListPanel.appendChild(createNode(`<div class="textcontent">${i18n("msg_nores")}</div>`))
    }
});

document.body.addEventListener("click", e => {
    let target = e.target;
    let name = target.getAttribute("name");
    if (target.className === "panel-title btn") {
        $(".panel.active").forEach(panel => {
            panel.className = "panel"
        });
        target.parentElement.className = "panel active"
    } else if (name === "btn_remove") {
        chrome.storage.local.remove(target.getAttribute("data-key"), () => {
            if (chrome.runtime.lastError) {
                alert(i18n("msg_err") + chrome.runtime.lastError.message)
            } else {
                target.parentElement.remove()
            }
        })
    } else if (name === "btn_active") {
        if(target.checked) {
                chrome.permissions.request({
                origins: [target.getAttribute("data-url")]
            }, granted => {
                if (!granted) {
                    target.removeAttribute("checked")
                }
            });
        } else {
            chrome.permissions.remove({
                origins: [target.getAttribute("data-url")]
            }, function(removed) {
                if (!removed) {
                    target.setAttribute("checked", true)
                }
            })
        }
    }
});

bind({
    ui_title: i18n("ui_setting_title"),
    ui_incognito: i18n("ui_sites_incognito"),
    ui_about: i18n("ui_setting_about"),
    ui_about_content: i18n("ui_setting_about_content")
}, document);