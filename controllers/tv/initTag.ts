export const initTag = async (body: any) => {
  try {
    const _data = body;
    if (
      !_data.ticker ||
      !_data.market_position ||
      !_data.action ||
      !_data.market_position_size ||
      !_data.contracts ||
      !_data.price ||
      !_data.comment ||
      !_data.prev_market_position ||
      !_data.market_position_size
    ) {
      throw "参数错误";
    }
    const _result = {
      symbol: _data.ticker,
      position_side: _data.market_position.toUpperCase(),
      side: "OPEN|CLOSE|INCR|DECR|TURNUP|TURNDOWN",
      action: _data.action.toUpperCase(),
      market_size: Number(_data.market_position_size), // 当前仓位
      quantity: Number(_data.market_position_size) - Number(_data.prev_market_position_size), //交易数量
      price: Number(_data.price), //价格
      comment: _data.comment
    };
    if (_data.market_position === "flat") {
      _result.side = "CLOSE";
      _result.position_side = _data.prev_market_position.toUpperCase();
      _result.action = _result.position_side == "LONG" ? "SELL" : "BUY";
    } else if (_data.prev_market_position === "flat") {
      _result.side = "OPEN";
      _result.action = _result.position_side == "LONG" ? "BUY" : "SELL";
    } else if (_data.market_position === _data.prev_market_position) {
      if (
        (_data.market_position === "long" && _data.action === "buy") ||
        (_data.market_position === "short" && _data.action === "sell")
      ) {
        _result.side = "INCR";
        _result.action = _result.position_side == "LONG" ? "BUY" : "SELL";
      } else {
        _result.side = "DECR";
        _result.action = _result.position_side == "LONG" ? "SELL" : "BUY";
      }
    } else if (_data.market_position !== _data.prev_market_position) {
      if (_data.market_position === "long" && _data.prev_market_position === "short") {
        _result.side = "TURNUP";
        _result.action = _result.position_side == "LONG" ? "BUY" : "SELL";
      } else {
        _result.side = "TURNDOWN";
        _result.action = _result.position_side == "LONG" ? "SELL" : "BUY";
      }
    }

    return _result;
  } catch (error: any) {
    throw error;
  }
};
