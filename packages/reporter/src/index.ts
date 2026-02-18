import Reporter from "./influx/index";
export default Reporter;

// Bonus: compat require() “direct”
module.exports = Reporter;
module.exports.default = Reporter;
