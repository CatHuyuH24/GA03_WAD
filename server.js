const express = require("express");
const { Pool } = require("pg");
const app = express();
const testRoute = require("./routes/testRoute");
const { randSequence, genSalt }  = require("./utils/salt");
const { newMd5Hash}=require("./utils/hasher/md5")
require("dotenv").config();

const pool = new Pool({
	user: process.env.DB_USERNAME,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
  });

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", "views");

// Middleware to serve static files
app.use(express.static("public"));

// Use the user routes
app.use("/", testRoute);

app.use(express.urlencoded({ extended: true }));

app.post("/register", async(req, res) => {
    const { name, email, password, passwordConfirm, agree } = req.body;
    if (!agree) {
       
		message = "Bạn cần đồng ý với các Điều khoản và Điều kiện.";
		return res.render("register", { message });
    }

    if (password !== passwordConfirm) {
       
		message = "Mật khẩu không khớp.";
		return res.render("register", { message });
    }

	const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
	if (userCheck.rows.length > 0) {
		message = "Email này đã được đăng ký. Vui lòng sử dụng email khác.";
		return res.render("register", { message });
	}
	
		
	const salt = genSalt(50);
	const md5 = newMd5Hash();
	const hashedPassword = md5.hash(password+salt); 

	const query = 'INSERT INTO users (email, password, salt) VALUES ($1, $2, $3)';
	const values = [email, hashedPassword, salt];

	await pool.query(query, values);
	console.log("Đã ghi dữ liệu vào cơ sở dữ liệu.");
	message = "Đăng ký thành công!";
	return res.render("register", { message });
	
	// console.log("Tên:", name);
	// console.log("Email:", email);
	// console.log("Mật khẩu:", hashedPassword);
	// res.send("Đăng ký thành công!");

});

app.get("/register", (req, res) => {
    res.render("register"); 
});

// Start the server
const HOST = process.env.SERVER_HOST || "localhost";
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, HOST, () => {
	console.log(`Server is running on port ${PORT}`);
});
