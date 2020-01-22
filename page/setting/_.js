let $panel = $(".content");
let $nohistoryC = $panel[0];
let $blackC = $panel[1];

chrome.storage.sync.get(null, datas => {
    for (let key in datas) {
        if (key === "size") {
            continue
        }
        let data = datas[key];
        let time;
        if (data.time) {
            time = i18n("newtab_visitdate") + new Date(data.time).format("yyyy-MM-dd")
        } else {
            time = ""
        }
        let imgDom = `<img height="1.7em" class="item-img" src="http://${data.name}/favicon.ico"/>`;
        let textDom = `<div class="item-name text-ellipsis">${time} - ${data.name}</div>`;
        let btnDom = `<button class="item-btn" data-group="${key}">×</button>`;
        let item = createNode(`<div class="item">${imgDom}${textDom}${btnDom}</div>`);
        if (data.disable) {
            $blackC.appendChild(item)
        } else {
            $nohistoryC.appendChild(item)
        }
    }
    if (!$nohistoryC.children.length) {
        $nohistoryC.appendChild(createNode(`<div class="textcontent">${i18n("msg_nores")}</div>`))
    }
    if (!$blackC.children.length) {
        $blackC.appendChild(createNode(`<div class="textcontent">${i18n("msg_nores")}</div>`))
    }
});

document.body.addEventListener("click", e => {
    let target = e.target;
    if (target.className === "panel-title btn") {
        $(".panel.active").forEach(panel => {
            panel.className = "panel"
        });
        target.parentElement.className = "panel active"
    } else if (target.className === "item-btn") {
        chrome.storage.sync.remove(target.getAttribute("data-group"), () => {
            if (chrome.runtime.lastError) {
                alert(i18n("msg_err") + chrome.runtime.lastError.message)
            } else {
                target.parentElement.remove()
            }
        })
    }
});

bind({
    ui_title: i18n("setting_title"),
    ui_nohistory: i18n("group_nohistory"),
    ui_black: i18n("group_black"),
    ui_about: i18n("setting_about"),
    ui_about_content: i18n("setting_about_content")
}, document);