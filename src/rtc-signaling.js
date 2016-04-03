/**
 * Signal as an initiator
 *
 * @param serverAddr The addess of the signaling server
 * @param offer The SDP offer
 */
function RtcSignalingInitiator(serverAddr, offer)
{
	this.callbacks = {};

	this._socket = null;

	var _constructor = function(this_)
	{
		this_._socket = io(serverAddr);
		this_._socket.on("connect", function()
		{
			console.log("[RtcSignalingInitiator] connect");
			this_._socket.emit("signaling-new-initiator");
		});

		this_._socket.on("disconnect", function()
		{
			console.log("[RtcSignalingInitiator] disconnect");
		});

		this_._socket.on("error", function(data)
		{
			console.log("[RtcSignalingInitiator] error", data);
		});

		this_._socket.on("signaling-new-initiator:token", function(token)
		{
			console.log("[RtcSignalingInitiator] signaling-new-initiator:token: "
					+ token);
			if (this_.callbacks[RtcSignalingInitiator.EVENT_TOKEN])
			{
				this_.callbacks[RtcSignalingInitiator.EVENT_TOKEN](token);
			}
		});

		this_._socket.on("signaling-new-receiver", function()
		{
			console.log("[RtcSignalingInitiator] signaling-new-receiver");
			this_._socket.emit("signaling-send-offer", offer);
		});

		this_._socket.on("signaling-send-answer", function(answer)
		{
			console.log("[RtcSignalingInitiator] signaling-send-answer");
			this_._socket.emit("signaling-ack-answer");
			this_.disconnect();
			if (this_.callbacks[RtcSignalingInitiator.EVENT_ANSWER])
			{
				this_.callbacks[RtcSignalingInitiator.EVENT_ANSWER](answer);
			}
		});
	}(this);
}

RtcSignalingInitiator.EVENT_ANSWER = "answer";
RtcSignalingInitiator.EVENT_TOKEN = "token";

RtcSignalingInitiator.prototype.disconnect = function()
{
	if (this._socket)
	{
		this._socket.disconnect();
		this._socket = null;
	}
}

/**
 * Register callbacks for several events, including:
 * - answer
 * 	- Called when an answer has been received. The answer SDP object is passed
 * 	as the arg
 * - token
 * 	- Called when a server token has been received. Token is to be sent to the
 * 	receiver in order to establish a connection. The token string is passed as
 * 	the arg
 * 
 * @param event
 * @param callback
 */
RtcSignalingInitiator.prototype.on = function(event, callback)
{
	var this_ = this;
	if (event === RtcSignalingInitiator.EVENT_ANSWER)
	{
		this_.callbacks[RtcSignalingInitiator.EVENT_ANSWER] = callback;
	}
	else if (event === RtcSignalingInitiator.EVENT_TOKEN)
	{
		this_.callbacks[RtcSignalingInitiator.EVENT_TOKEN] = callback;
	}
	return this_;
}

/**
 * Signal as an receiver (the one receiving the token)
 *
 * @param serverAddr The addess of the signaling server
 * @param token The received token
 */
function RtcSignalingReceiver(serverAddr, token)
{
	this.callbacks = {};

	this._socket = null;

	var _constructor = function(this_)
	{
		this_._socket = io(serverAddr);
		this_._socket.on("connect", function()
		{
			console.log("[RtcSignalingReceiver] connect");
			this_._socket.emit("signaling-new-receiver", token);
		});

		this_._socket.on("disconnect", function()
		{
			console.log("[RtcSignalingReceiver] disconnect");
		});

		this_._socket.on("error", function(data)
		{
			console.log("[RtcSignalingReceiver] error", data);
		});

		this_._socket.on("signaling-req-disconnect", function(reason)
		{
			console.log("[RtcSignalingReceiver] signaling-req-disconnect: ",
					reason);
			this_._socket.disconnect();
			if (this_.callbacks[RtcSignalingReceiver.EVENT_ERROR])
			{
				this_.callbacks[RtcSignalingReceiver.EVENT_ERROR](reason);
			}
		});

		this_._socket.on("signaling-send-offer", function(offer)
		{
			console.log("[RtcSignalingReceiver] signaling-send-offer");
			if (this_.callbacks[RtcSignalingReceiver.EVENT_OFFER])
			{
				this_.callbacks[RtcSignalingReceiver.EVENT_OFFER](offer);
			}
		});

		this_._socket.on("signaling-ack-answer", function()
		{
			console.log("[RtcSignalingReceiver] signaling-ack-answer");
			this_.disconnect();
		});
	}(this);
}

RtcSignalingReceiver.EVENT_ERROR = "error";
RtcSignalingReceiver.EVENT_OFFER = "offer";

RtcSignalingReceiver.prototype.disconnect = function()
{
	if (this._socket)
	{
		this._socket.disconnect();
		this._socket = null;
	}
}

/**
 * Register callbacks for several events, including:
 * - error
 * 	- Called when some error happens, like unrecognized token. A reason string
 * 	is passed as the arg
 * - offer
 * 	- Called when an offer has been received. The offer SDP object is passed as
 * 	the arg
 * 
 * @param event
 * @param callback
 */
RtcSignalingReceiver.prototype.on = function(event, callback)
{
	if (event === RtcSignalingReceiver.EVENT_ERROR)
	{
		this.callbacks[RtcSignalingReceiver.EVENT_ERROR] = callback;
	}
	else if (event === RtcSignalingReceiver.EVENT_OFFER)
	{
		this.callbacks[RtcSignalingReceiver.EVENT_OFFER] = callback;
	}
	return this;
}

RtcSignalingReceiver.prototype.sendAnswer = function(answer)
{
	this._socket.emit("signaling-send-answer", answer);
}

RtcSignalingReceiver.prototype.disconnect = function()
{
	if (this._socket)
	{
		this._socket.disconnect();
		this._socket = null;
	}
}
