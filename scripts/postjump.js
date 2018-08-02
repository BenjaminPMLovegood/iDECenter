$.extend({
    postjump : function(url, args) {
        var form = $("<form method='POST'/>");
        form.attr({"action":url});
        $.each(args, function(key, value) {
            form.append($("<input type='hidden'>").attr({ "name" : key }).val(value));
        });

        form.appendTo(document.body);
        form.submit();
        document.body.removeChild(form[0]);
    }
});