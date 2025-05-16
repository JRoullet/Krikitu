import mysql from "mysql";

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'krikitu'
});

connection.connect();

connection.query('SELECT * from question', function (error, results, fields) {
    if (error) throw error;
    console.log('Les questions sont : ', results);
});