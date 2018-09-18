var express = require('express');
var router = express.Router();

router.post('/messages', function(req, res, next) {
    let count = req.body.count;
    let email = req.body.email;
    let message = req.body.message;

    console.log(process)
    res.status(200);
});

module.exports = router;
