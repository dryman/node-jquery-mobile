HOST = null;
PORT = 8001;
MESSAGE_BACKLOG = 100;

var fu = require("./fu"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring");

var channel = new function () {
  var messages = [],
      callbacks = [];

  this.appendMessage = function (text) {
    var m = { text: text, timestamp: (new Date()).getTime() };
    sys.puts(text);

    messages.push(m);

    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
      sys.log("doing callback from appendMessage");
    }
    while (messages.length > MESSAGE_BACKLOG) {
      messages.shift();
    }
  };

  this.query = function (since, callback) {
    var matching = [];
    /*
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      sys.log("since is", since);
      sys.log("message.timestamp is", message.timestamp);
      if (message.timestamp > since)
        matching.push(messages)
    }

    if (matching.length != 0) {
      sys.log("doing callback from query");
      callback(matching);
    } else {
      callbacks.push({timestamp: new Date(), callback: callback});
      sys.log("pushing callback");
    }
    */
    callbacks.push({timestamp: new Date(), callback: callback});
  };

  setInterval(function() {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000){
      sys.log("calling callback in setInterval");
      callbacks.shift().callback([]);
    }
  }, 3000);
};

fu.listen(Number(process.env.PORT ||PORT), HOST);
fu.get("/", fu.staticHandler("index.html"));
fu.get("/client.js", fu.staticHandler("client.js"));
fu.get("/jquery.toastmessage.js", fu.staticHandler("jquery.toastmessage.js"));
fu.get("/css/jquery.toastmessage.css", fu.staticHandler("css/jquery.toastmessage.css"));
fu.get("/images/close.gif", fu.staticHandler("images/close.gif"));
fu.get("/images/error.png", fu.staticHandler("images/error.png"));
fu.get("/images/notice.png", fu.staticHandler("images/notice.png"));
fu.get("/images/success.png", fu.staticHandler("images/success.png"));
fu.get("/images/warning.png", fu.staticHandler("images/warning.png"));

fu.get("/recv",function(req,res){
  if (!qs.parse(url.parse(req.url).query).since){
    res.simpleJSON(400, {error: "Must supply since parameter"});
    return;
  }
  var since = parseInt(qs.parse(url.parse(req.url).query).since,10);
  channel.query(since, function(messages){
    res.simpleJSON(200, {messages: messages});
    sys.log("done callback from /recv");
  });
});

fu.get("/send",function(req, res) {
  sys.puts("send");
  sys.puts(req);
  var text = qs.parse(url.parse(req.url).query).text;
  channel.appendMessage(text);
  res.simpleJSON(200,{});
});
