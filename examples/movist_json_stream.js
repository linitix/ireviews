var fs = require("fs");
var path = require("path");

var iReviews = require("../libs/index");

var ireviews = new iReviews.Processor({
  store_id      : "840784742",
  countries_code: [ "GB", "FR", "DE", "BE", "ES", "US", "RU" ],
  format        : "json"
});

ireviews.parse(function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

ireviews.on("error", function (err) {
  console.error(err);
  process.exit(1);
});

ireviews.on("end", function (reviews) {
  fs.writeFile(
    path.join(__dirname, "..", "tmp", "movist_json_stream_result.json"),
    JSON.stringify(reviews),
    { encoding: "utf8" },
    function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log("Result saved in file");
      process.exit(0);
    }
  );
});
