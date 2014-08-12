var iReviews = require("../libs/index");

var ireviews = new iReviews.Processor({
    store_id: "493081063",
    countries_code: [ "BE", "KR", "ES", "MX", "NO", "US", "FR", "NL", "DE", "CN", "CA", "GB", "IT", "AU", "GR", "SE",
        "SG", "BR", "ID", "IE", "DK", "IL", "CH", "RU", "JP", "HU", "GT", "ZA", "CZ", "TR", "UY", "SA", "RO", "AT",
        "AR", "NZ", "MY", "HK", "SK", "NI", "CL", "IN", "CO", "PE", "TH", "TW", "HR", "PT", "KE" ],
    format: "xml",
    delay: 2000
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
