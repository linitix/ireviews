var iReviews = require("../libs/index");

var ireviews = new iReviews.Processor({
    store_id: "493081063",
    countries_code: [ "GB", "FR", "DE", "BE", "ES", "US", "RU" ],
    format: "json"
});

ireviews.listAll(
    function (err, data) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        console.log(data);
        process.exit();
    }
);
