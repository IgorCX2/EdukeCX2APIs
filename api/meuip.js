const express = require("express");
const cors = require('cors');
const router = express.Router();
const app = express();
const requestIp = require('request-ip');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    next();
});

router.get('/meu-ip', (req, res) => {
    const clientIp = requestIp.getClientIp(req);
    return res.json({
        ip: clientIp
    });
});
module.exports = router;