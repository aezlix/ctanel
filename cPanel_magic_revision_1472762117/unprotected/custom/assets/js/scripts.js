jQuery(document).ready(function($) {
  var ip_regex = /^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}$/;

  /* BOOTSTRAP TOOLTIPS */
  $('[data-toggle="tooltip"]').tooltip({
    placement: 'right'
  });

  /* BOOTSTRAP POPOVER */
  $('[data-toggle="popover"]').popover();
  $('[data-toggle="popover"]').on('click', function (e) {
    $('[data-toggle="popover"]').not(this).popover('hide');
  });

  $('.items > li:nth-child(7n)').after('<li class="clearfix"></li>');

  $('#item_webemail').on('click',function() {
    $('#webmail-modal').modal('show');
    return false;
  });

  $('#item_ssh-shell-access').on('click',function() {
    $('#ssh-modal').modal('show');
    return false;
  });

  $('.alert-close').on('click',function() {
    $(this).closest('.alert').fadeOut(200);
    return false;
  });

  $('.modal').on('show', function () {
    $('body').addClass('blured');
  })

  $('.modal').on('hide', function () {
    $('body').removeClass('blured');
  });

  $('body').on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    });
  });

  $('#sshform').on('submit', function($event) {
    var ip = $('#ssh-modal input[name="ip"]').val();

    if (!ip_regex.test(ip)) {
      $('.alert.invalid-ip').show();
      $event.preventDefault();
      return true;
    }

    $(this).find('.control-group').fadeOut(200, function() {
      $('#sshform .loader').fadeIn(200);
    });

    ssh(ip);

    return false;
  });

  $('#ssh-modal input[name=ip]').keyup(function($event){
    value = $($event.currentTarget).val();
    alert = $('.alert.invalid-ip');
    if (ip_regex.test(value)) {
      alert.hide();
    } else {
      alert.show();
    }
  });

  $('#sshform [data-dismiss="modal"]').on('click', function() {
    $('#sshform .result').html('');
    $('#sshform .loader').hide();
    $('#sshform .control-group').show();
  });

  $('#create-account').on('hide', function () {
    var panel = $('.validation_error_panel');

    panel.each(function() {
      if($(this).is(':visible')) {
        $(this).html('').css('visibility', 'hidden');
      }
    });

    $('#create-account #add_email_account, #create-account input[type="password"]').each(function() {
      $(this).val('');
    });

    $('#pass-gen').fadeOut();

    $('#password_strength').html('<div style="position: relative; width: 100%; height: 100%"><div style="position: absolute; left: 0px; width: 100%; height: 100%; text-align: center; z-index: 1; padding: 0px; margin: 0px"><table style="width: 100%; height: 100%; padding: 0px; margin: 0px"><tbody><tr style="padding: 0px; margin: 0px"><td valign="middle" style="padding: 0px; margin: 0px">Very Weak (0/100)</td></tr></tbody></table></div><div style="position: absolute; left: 0px; width: 0%; height: 100%; background-color: #FF0000;"></div></div>');

  })

});

function customPass() {

  var pass_gen = $('#pass-gen');
  var pass_input = $('#generated-pass');

  var create_password = function(options) {

    // set the length
    var length;
    if (CPANEL.validate.positive_integer(options.length) == false) length = 12;
    else length = options.length;

    // possible password characters
    var uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var lowercase = "abcdefghiklmnopqrstuvwxyz";
    var numbers = "0123456789";
    var symbols = "!@#$%^&*()-_=+{}[];,.?~";

    var chars = '';
    if (options.uppercase == true) chars += uppercase;
    if (options.lowercase == true) chars += lowercase;
    if (options.numbers == true) chars += numbers;
    if (options.symbols == true) chars += symbols;

    // generate the thing
    var password = '';
    for (var i=0; i<length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      password += chars.substring(rnum, rnum + 1);
    }

    return password;
  }
  // get the password options from the interface
  var get_password_options = function() {
    var options = {};

    options.length = 12;
    options.uppercase = true;
    options.lowercase = true;
    options.numbers = true;
    options.symbols = true;

    return options;
  };

  pass_input.val(create_password(get_password_options()))
    pass_gen.fadeIn(200);

}


function usePass() {

  var pass_input = $('#add_email_password2, #add_email_password1');
  var pass_gen = $('#generated-pass');

  pass_input.val(pass_gen.val());
}


function createEmail() {

  var email = $("#add_email_account").val();
  var domain = $("#add_email_domain").val();
  var password = $("#add_email_password1").val();
  var quota = 0;
  var nextStep = $('#wizard-next');
  if ($("#quota_number").is(':checked')) {
    quota = $("#quota_number_input").val();
  }

  // create the API call
  var api2_call = {
    cpanel_jsonapi_version : 2,
    cpanel_jsonapi_module  : "Email",
    cpanel_jsonapi_func    : "addpop",
    email    : email,
    password : password,
    quota    : quota,
    domain   : domain
  };

  // callback functions
  var callback = {
    success : function(o) {

      // parse the JSON
      try {
        var data = YAHOO.lang.JSON.parse(o.responseText);
      }
      catch(e) {
        CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
        return;
      }

      // success
      if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 1)) {
        var status = api2_call.email + "@" + api2_call.domain;
        CPANEL.widgets.status_bar("add_email_status_bar", "success", LANG.account_created, status);
        YAHOO.util.Dom.get("add_email_create_status").innerHTML = "";

        window.location.href = "wizard2.html?acct=" + status;

        return;
      }

      // failure
      if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 0)) {
        CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
        YAHOO.util.Dom.setStyle("add_email_create", "display", "block");
        YAHOO.util.Dom.get("add_email_create_status").innerHTML = "";
        return;
      }

      // unknown?
      var error = data.cpanelresult.error || LANG.unknown_error;
      CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, error);
    },

    failure : function(o) {
      reset_add_account_form();
      CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
    }
  };

  // send the AJAX request
  YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

  YAHOO.util.Dom.setStyle("add_email_create", "display", "none");
  YAHOO.util.Dom.get("add_email_create_status").innerHTML = CPANEL.icons.ajax + " " + LANG.creating_account + "...";

}
