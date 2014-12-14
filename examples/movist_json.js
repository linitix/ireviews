var fs = require("fs");
var path = require("path");

var iReviews = require("../libs/index");

var ireviews = new iReviews.Processor({
  store_id      : "840784742",
  countries_code: [ "GB", "FR", "DE", "BE", "ES", "US", "RU" ],
  format        : "json"
});

ireviews.listAll(
  function (err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    fs.writeFile(
      path.join(__dirname, "..", "tmp", "movist_json_result.json"),
      JSON.stringify(data),
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
  }
);
