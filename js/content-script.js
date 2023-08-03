let currentDomain = window.location.hostname;
let autoReplyText = '';
let isAutoReply = false;
let autoReplyCount = 0;
/**
 * 初始化弹层
 */
function initToolButton() {
	const html = '<div class="gpt-sr-container">\n' +
		'    <div class="gpt-sr-sidebar">\n' +
		'      <button id="gpt-sr-toggleButton">开启自动回复</button>\n' +
		'    </div>\n' +
		'  </div>\n' +
		'  \n' +
		'  <div id="gpt-sr-popup" class="gpt-sr-popup">\n' +
		'    <button class="gpt-sr-close-btn">&times;</button>\n' +
		'	 <button class="gpt-sr-starting-btn">开始执行</button>\n' +
		'    <div class="gpt-sr-content">\n' +
		'      <h2 class="gpt-sr-title">关键词列表</h2>\n' +
		'      <ul class="gpt-sr-list">\n' +
		'      </ul>\n' +
		'    </div>\n' +
		'  </div>';
	const popupElement = document.createElement("div");
	popupElement.innerHTML = html;
	document.body.appendChild(popupElement);
	document.querySelector("#gpt-sr-toggleButton").addEventListener("click", function() {
		if(this.innerText.includes("开启自动回复"))
		{
			this.disabled = true;
			isAutoReply = true;
			this.style.backgroundColor = 'red';
			this.innerText = this.innerText.replace("开启自动回复","关闭自动回复");
			chrome.runtime.sendMessage({"type":"check_mkey"}, function (response) {
				console.log(response.farewell)
			});
		}
		else if(this.innerText.includes("关闭自动回复"))
		{
			this.disabled = false;
			isAutoReply = false;
			this.style.backgroundColor = '#00bebd';
			this.innerText = this.innerText.replace("关闭自动回复","开启自动回复");
		}
	});
}

function activiteToolButton()
{
	document.querySelector("#gpt-sr-toggleButton").disabled = false;
}

/**
 * 初始化提示窗
 */
function initPromptMessagePopup()
{
	let html = "<div id=\"nmx_boss_popup\" class=\"custom-popup\">\n" +
		"\t\t<div class=\"custom-popup-overlay\"></div>\n" +
		"\t\t<div class=\"custom-popup-content\">\n" +
		"\t\t\t<span id=\"nmx_boss_popup_message\" class=\"custom-popup-question\"></span>\n" +
		"\t\t\t<button id=\"nmx_boss_close_popupbtn\" class=\"custom-popup-close-btn\">确认</button>\n" +
		"\t\t</div>\n" +
		"\t</div>";
	const popupElement = document.createElement("div");
	popupElement.innerHTML = html;
	document.body.appendChild(popupElement);
	// 获取弹窗元素
	const popup = document.getElementById('nmx_boss_popup');
	// 获取关闭按钮元素
	const closeButton = document.getElementById('nmx_boss_close_popupbtn');

	// 点击关闭按钮关闭弹窗
	closeButton.addEventListener('click', function (){
		popup.style.display = 'none';
	});
}


// 显示弹窗并设置错误提示文字
function showPromptMessagePopup(message,type =1) {
	// 获取弹窗元素
	const popup = document.getElementById('nmx_boss_popup');
	// 获取错误提示元素
	const errorText = document.getElementById('nmx_boss_popup_message');
	errorText.textContent = message;
	popup.style.display = 'block';
	if(type == 2)
	{
		// 获取关闭按钮元素
		const closeButton = document.getElementById('nmx_boss_close_popupbtn');
		closeButton.style.display = 'none';
		setTimeout(function (){
			closeButton.click();
		},3000);
	}
}

/**
 * 引入css文件
 * @param url
 */
function addStylesheet(url) {
	const linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	linkElement.type = "text/css";
	linkElement.href = chrome.runtime.getURL(url);
	document.head.appendChild(linkElement);
}

function startAutoReply()
{
	let listItems = document.querySelectorAll("div.chat-container div.chat-user div[role=group] div[role=listitem]");
	let noRelyItems = Array.from(listItems).filter((node) => {
		let figureElement = node.querySelector("div.figure");
		let newCountElement = figureElement.querySelector("span.news-count");
		let newCount = 0;
		if(newCountElement)
		{
			newCount = parseInt(newCountElement.innerText);
		}
		return newCount > 0;
	});

	console.log(noRelyItems.length);
	handleAutoReply(0,noRelyItems);
}

function updateAutoReplyCount()
{
	autoReplyCount ++;
	let btn = document.querySelector("#gpt-sr-toggleButton");
	btn.innerText = btn.innerText.replace(/\([^)]*\)/g, '') + "(" + autoReplyCount + ")";
}

function handleAutoReply(itemIndex,listItems,cancel = false)
{
	if(cancel || !isAutoReply) return;
	if(itemIndex == listItems.length)
	{
		setTimeout(function (){
			startAutoReply();
		},2000);
		return;
	}
	//if(itemIndex == 5) return;

	let node = listItems[itemIndex];
	if(!node) return;

	// 操作每个节点的代码
	let figureElement = node.querySelector("div.figure");
	let newCountElement = figureElement.querySelector("span.news-count")
	let titleElement = node.querySelector("div.text.uid");
	let newCount = 0;
	if(newCountElement)
	{
		newCount = parseInt(newCountElement.innerText);
	}
	console.log(itemIndex,newCount,titleElement.innerText);
	node.querySelector("div.geek-item-wrap").click();
	setTimeout(function (){
		let messageItems = document.querySelectorAll("div.chat-container div.chat-conversation div.conversation-box div.chat-message-list div.message-item");
		console.log(checkHasReply(messageItems),messageItems);
		if(!checkHasReply(messageItems))
		{
			document.querySelector("#boss-chat-editor-input").innerText = autoReplyText;
			setTimeout(function (){
				document.querySelector("div.submit-content div.submit").click();
				updateAutoReplyCount();
				setTimeout(function (){
					// 使用正则表达式匹配包含"换微信"文字的DOM元素
					const searchTextRegex = /换微信/i; // i 表示不区分大小写
					const optBtns = Array.from(document.querySelectorAll("div.chat-container span.operate-btn")).filter((element) => {
						return searchTextRegex.test(element.innerText);
					});
					if(optBtns.length > 0)
					{
						optBtns[0].click();
						console.log(optBtns[0].innerText);
						let optParent = optBtns[0].parentElement;
						//交换微信
						setTimeout(function (){
							let okBtn = optParent.querySelector("div.exchange-tooltip span.boss-btn-primary");
							if(okBtn) okBtn.click();
							setTimeout(function (){
								handleAutoReply(itemIndex + 1,listItems,cancel);
							},2000);
						},300);
					}
				},3000);
			},100);
		}
		else
		{
			handleAutoReply(itemIndex + 1,listItems,cancel);
		}
	},3000);
}

function checkHasReply(messageItems)
{
	for (let i=0;i<messageItems.length;i++)
	{
		let item = messageItems[i];
		let myselfItem = item.querySelector("div.item-myself");
		if(myselfItem) return true;
	}
	return false;
}
function initSetting(callback)
{
	// 获取存储的值
	chrome.storage.local.get('nmx_boss_setting', function (data) {
		autoReplyText = (data.hasOwnProperty("nmx_boss_setting") && data.nmx_boss_setting.hasOwnProperty("autoReply")) ? data.nmx_boss_setting.autoReply : '';
		// 在这里使用存储的值
		console.log(autoReplyText);
		if(callback) callback();
	});
}
// 在页面加载完成后插入弹层和引入CSS文件
window.onload = function() {
	if(currentDomain.includes("zhipin.com"))
	{
		initSetting(function (){
			initPromptMessagePopup();
			initToolButton();
			addStylesheet("css/page_layer.css");
		});
	}
};
/**
 * 事件监听
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	window.focus();
	console.log(message.type);
	if(message.type == 'open_auto_reply')
	{
		isAutoReply = true;
		startAutoReply();
	}
	else if(message.type == 'close_auto_reply')
	{
		isAutoReply = false;
	}
	else if(message.type == 'check_mkey_complete')
	{
		activiteToolButton();
		if(message.data.hasOwnProperty("code") && message.data.code !=0)
		{
			showPromptMessagePopup(message.data.message);
		}
		else
		{
			startAutoReply();
		}
	}
});
