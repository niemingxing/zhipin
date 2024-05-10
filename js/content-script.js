let currentDomain = window.location.hostname;
let autoReplyText = '';
let chatOpt = '';
let markKeywords = '';
let isAutoReply = false;
let autoReplyCount = 0;

const head = document.head;
const proxyScript = createScript(chrome.runtime.getURL("js/inject.js"))

if(head.firstChild) {
	// proxyScript 要保证在第一个插入
	head.insertBefore(proxyScript, head.firstChild);
} else {
	head.appendChild(proxyScript);
}

function createScript(src) {
    const script = document.createElement('script');
    script.setAttribute('src', src);
    return script;
}


window.addEventListener('ajaxGetData', function(e) {
	const data = e?.detail;
	if(!data) return;
	const responseURL = data?.responseURL;
	// boss 直聘接口
	if(responseURL){
		if(responseURL.indexOf('/search/joblist.json') !== -1) {
			console.log(data?.response);
		}
	}
})


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
					//const searchTextRegex = /换微信/i; // i 表示不区分大小写
					if(chatOpt!="")
					{
						const searchTextRegex = new RegExp(chatOpt, "i");
						const optBtns = Array.from(document.querySelectorAll("div.chat-container span.operate-btn")).filter((element) => {
							return searchTextRegex.test(element.innerText);
						});
						console.log(chatOpt);
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
					}
					else
					{
						setTimeout(function (){
							handleAutoReply(itemIndex + 1,listItems,cancel);
						},2000);
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

/**
 * 标记目标对象
 */
function markTargetObject(){
	// 获取 class 为 "card-list" 的 ul 元素
	// 假设 iframe 的 id 是 "myIframe"
	var currentPageURL = window.location.href;
	if(currentPageURL.includes("recommend"))
	{
		markRecommendTarget();
	}
	else if(currentPageURL.includes("search"))
	{
		markSearchTarget();
	}
	else if(currentPageURL.includes("interaction"))
	{
		markInteractionTarget();
	}
	else if(currentPageURL.includes("geek/manage"))
	{
		markGeekManageTarget();
	}
	else if(currentPageURL.includes("chat/index"))
	{
		markChatTarget();
	}
}

function markRecommendTarget(){
	var iframe = document.querySelector('iframe[name=recommendFrame]');
	var keywords = markKeywords.split(",");
	console.log(keywords);
	//console.log(iframe);
	// 检查 iframe 是否加载完成
	if (iframe.contentWindow && iframe.contentWindow.document) {
		// 获取 iframe 的 document 对象
		var iframeDoc = iframe.contentWindow.document;

		var ulElement = iframeDoc.querySelector('ul.card-list') ? iframeDoc.querySelector('ul.card-list') : iframeDoc.querySelector('ul.recommend-card-list');
		if (ulElement) {
			// 获取该 ul 元素下的所有 class 为 "card-item" 的 li 元素
			var liElements = ulElement.querySelectorAll('li');
			// 遍历每个 li 元素
			liElements.forEach(function (liElement) {

				// 获取 li 元素的文本内容（这里可能需要处理文本节点的子元素）
				var liText = liElement.textContent || liElement.innerText;
				//console.log(liText);
				// 检查 li 文本是否包含关键词数组中的任何一个关键词
				if (markKeywords !="" && keywords.some(function(keyword) {
					return liText.includes(keyword);
				})){
					// 在每个 li 元素中查找 class 为 "candidate-card-wrap" 的 div 元素
					var divElement = liElement.querySelector('div.candidate-card-wrap');
					console.log(liText);
					if (divElement) {
						// 如果找到了该 div 元素，则修改其背景颜色
						divElement.style.backgroundColor = '#8deceb'; // 假设我们要将其设置为红色
					} else {
						console.log('在 li 中未找到 class 为 "candidate-card-wrap" 的 div 元素');
					}
				}
			});
		} else {
			console.log('没有找到 class 为 "card-list" 的 ul 元素');
		}
	}
}

function markSearchTarget(){
	var iframe = document.querySelector('iframe[name=searchFrame]');
	var keywords = markKeywords.split(",");
	console.log(keywords);
	//console.log(iframe);
	// 检查 iframe 是否加载完成
	if (iframe.contentWindow && iframe.contentWindow.document) {
		// 获取 iframe 的 document 对象
		var iframeDoc = iframe.contentWindow.document;

		var ulElement = iframeDoc.querySelector('div.card-list');
		if (ulElement) {
			// 获取该 ul 元素下的所有 class 为 "card-item" 的 li 元素
			var liElements = ulElement.querySelectorAll('li');
			// 遍历每个 li 元素
			liElements.forEach(function (liElement) {

				// 获取 li 元素的文本内容（这里可能需要处理文本节点的子元素）
				var liText = liElement.textContent || liElement.innerText;
				//console.log(liText);
				// 检查 li 文本是否包含关键词数组中的任何一个关键词
				if (markKeywords !="" && keywords.some(function(keyword) {
					return liText.includes(keyword);
				})){
					// 在每个 li 元素中查找 class 为 "candidate-card-wrap" 的 div 元素
					var divElement = liElement.querySelector('a');
					console.log(liText);
					if (divElement) {
						// 如果找到了该 div 元素，则修改其背景颜色
						divElement.style.backgroundColor = '#8deceb'; // 假设我们要将其设置为红色
					} else {
						console.log('在 li 中未找到 class 为 "candidate-card-wrap" 的 div 元素');
					}
				}
			});
		} else {
			console.log('没有找到 class 为 "card-list" 的 ul 元素');
		}
	}
}

function markInteractionTarget(){
	var iframe = document.querySelector('iframe[name=interactionFrame]');
	var keywords = markKeywords.split(",");
	console.log(keywords);
	//console.log(iframe);
	// 检查 iframe 是否加载完成
	if (iframe.contentWindow && iframe.contentWindow.document) {
		// 获取 iframe 的 document 对象
		var iframeDoc = iframe.contentWindow.document;

		var ulElement = iframeDoc.querySelector('ul.card-list');
		if (ulElement) {
			// 获取该 ul 元素下的所有 class 为 "card-item" 的 li 元素
			var liElements = ulElement.querySelectorAll('li');
			// 遍历每个 li 元素
			liElements.forEach(function (liElement) {

				// 获取 li 元素的文本内容（这里可能需要处理文本节点的子元素）
				var liText = liElement.textContent || liElement.innerText;
				//console.log(liText);
				// 检查 li 文本是否包含关键词数组中的任何一个关键词
				if (markKeywords !="" && keywords.some(function(keyword) {
					return liText.includes(keyword);
				})){
					// 在每个 li 元素中查找 class 为 "candidate-card-wrap" 的 div 元素
					var divElement = liElement.querySelector('div.candidate-card-wrap');
					console.log(liText);
					if (divElement) {
						// 如果找到了该 div 元素，则修改其背景颜色
						divElement.style.backgroundColor = '#8deceb'; // 假设我们要将其设置为红色
					} else {
						console.log('在 li 中未找到 class 为 "candidate-card-wrap" 的 div 元素');
					}
				}
			});
		} else {
			console.log('没有找到 class 为 "card-list" 的 ul 元素');
		}
	}
}

function markGeekManageTarget(){
	var iframe = document.querySelector('iframe[name=geekManageFrame]');
	var keywords = markKeywords.split(",");
	console.log(keywords);
	//console.log(iframe);
	// 检查 iframe 是否加载完成
	if (iframe.contentWindow && iframe.contentWindow.document) {
		// 获取 iframe 的 document 对象
		var iframeDoc = iframe.contentWindow.document;

		var ulElement = iframeDoc.querySelector('tbody.ui-tablepro-tbody');
		if (ulElement) {
			// 获取该 ul 元素下的所有 class 为 "card-item" 的 li 元素
			var liElements = ulElement.querySelectorAll('tr');
			// 遍历每个 li 元素
			liElements.forEach(function (liElement) {

				// 获取 li 元素的文本内容（这里可能需要处理文本节点的子元素）
				var liText = liElement.textContent || liElement.innerText;
				//console.log(liText);
				// 检查 li 文本是否包含关键词数组中的任何一个关键词
				if (markKeywords !="" && keywords.some(function(keyword) {
					return liText.includes(keyword);
				})){
					// 在每个 li 元素中查找 class 为 "candidate-card-wrap" 的 div 元素
					var divElements = liElement.querySelectorAll('td');
					console.log(liText);
					divElements.forEach(function (divElement) {
						divElement.style.backgroundColor = '#8deceb';
					});

				}
			});
		} else {
			console.log('没有找到 class 为 "card-list" 的 ul 元素');
		}
	}
}

function markChatTarget(){
	var topElement = document.querySelector('div.base-info-single-top');
	var mainElement = document.querySelector('div.base-info-single-main');
	if(mainElement)
	{
		var keywords = markKeywords.split(",");
		var text = mainElement.textContent || mainElement.innerText;
		if (markKeywords !="" && keywords.some(function(keyword) {
			return text.includes(keyword);
		})){
			topElement.style.backgroundColor = '#8deceb';
			mainElement.style.backgroundColor = '#8deceb';
		}else{
			topElement.style.backgroundColor = '';
			mainElement.style.backgroundColor = '';
		}
	}

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
		chatOpt = (data.hasOwnProperty("nmx_boss_setting") && data.nmx_boss_setting.hasOwnProperty("chatOpt")) ? data.nmx_boss_setting.chatOpt : '';
		markKeywords = (data.hasOwnProperty("nmx_boss_setting") && data.nmx_boss_setting.hasOwnProperty("keywords")) ? data.nmx_boss_setting.keywords : '';
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
			setInterval(function (){
				markTargetObject();
			},1000);
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
