$.extend({
    toClipboard : function(val) {
        if (!window.cliparea) {
            window.cliparea = $("<input type='text'>");
            window.cliparea.appendTo(document.body);
        }

        window.cliparea.attr({ style : "" });
        window.cliparea.val(val);
        window.cliparea.select();
        document.execCommand('copy');
        window.cliparea.attr({ style : "display:none" });
    }
});
