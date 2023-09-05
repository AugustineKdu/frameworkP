$(document).ready(function() {
    $("form").on('submit', function(e) {
        e.preventDefault();
        
        const email = $("#email").val();
        const password = $("#password").val();
        
        $.post("/login", { email, password }, function(data) {
            if (data.valid) {
                window.location.href = "/account";
            } else {
                $("#errormsg").removeClass("hidemessage").addClass("showmessage");
            }
        });
    });
});
