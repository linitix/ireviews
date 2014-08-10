var iReviews = require("../libs/index");

var ireviews = new iReviews.Processor({
    store_id: "493081063",
    countries_code: [ "GB", "FR", "DE", "BE", "ES", "US", "RU" ],
    format: "json"
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
    console.log(reviews);
    process.exit(0);
});

ireviews.on("review", function (review) {
    console.log(review);
});
