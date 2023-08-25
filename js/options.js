// options.js
document.addEventListener('DOMContentLoaded', function() {
    var mKeyInput = document.getElementById('mKey');
    var autoReplyInput = document.getElementById('autoReply');
    var chatOpt = document.getElementById('chatOpt');
    var saveButton = document.getElementById('saveButton');

    // 获取保存的密钥值并设置输入框的默认值
    chrome.storage.local.get('nmx_boss_setting', function(result) {
        let setting = result.nmx_boss_setting;
        if (setting) {
            mKeyInput.value = setting.mkey;
            autoReplyInput.value = setting.autoReply;
            chatOpt.value = setting.chatOpt;
            console.log(setting);
        }
    });

    // 保存按钮点击事件处理程序
    saveButton.addEventListener('click', function() {
        let setting = {
            'mkey':  mKeyInput.value,
            'autoReply': autoReplyInput.value,
            'chatOpt':chatOpt.value
        };
        chrome.storage.local.set({ 'nmx_boss_setting': setting }, function() {
            alert('设置已保存');
        });
    });
});
