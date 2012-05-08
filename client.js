var CONFIG = {last_message_time: 1};
var first_poll = true;

function scrollDown () {
  window.scrollBy(0, 100000000000000);
  // $("#entry").focus();
}


function longPoll (data) {
  console.log("starting longPoll");
  if (data && data.messages) {
    for (var i = 0; i < data.messages.length; i++){
      var message = data.messages[i];
      if (message.timestamp > CONFIG.last_message_time)
        CONFIG.last_message_time = message.timestamp;

      console.log(message.text);
      $('div[data-role="content"] > p').append("<p>".concat(message.text, "</p>"));
      $().toastmessage("showToast",{
        text: message.text,
        position: 'top-center',
        type: 'success'
      });
    }
  }
  if (first_poll) first_poll = false;

  $.ajax({ cache: false,
           type: "GET",
           url: "/recv",
           dataType: "json",
           data: { since: CONFIG.last_message_time },
           error: function () {
             console.log("long poll error. trying again...");
             setTimeout(longPoll, 10*1000);
           },
           success: function (data) {
             longPoll(data);
           }
        });
}

$(document).ready(function () {
  console.log("document ready");
  longPoll();
});
