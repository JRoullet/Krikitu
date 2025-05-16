import express from 'express';
const app = express()
const port = 3000
const index = "index.html";


app.get('/', function (req, res) {
        res.sendFile(index);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
