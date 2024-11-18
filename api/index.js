let express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
PGPASSWORD = decodeURIComponent(PGPASSWORD);

let app = express();
app.use(cors())
app.use(express.json());

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function getPostgresVersion() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT version()");
        console.log(res.rows[0]);
    } finally {
        client.release();
    }
}

getPostgresVersion();

app.get('/', (req, res) => {
    res.send("If you see this, the API is working!")
})

app.get("/booking/:user_id", async (req, res) => {
    const { user_id } = req.params;
    const client = await pool.connect();
    try {
        const posts = await client.query("SELECT * FROM bookings WHERE user_id = $1", [user_id]);
        res.json(posts.rows);
    } catch (error) {
        console.error("Error executing query", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
})

app.get("/booking/:user_id/:booking_id", async (req, res) => {
    const { user_id, booking_id } = req.params;
    const client = await pool.connect();
    try {
        const posts = await client.query("SELECT * FROM bookings WHERE user_id = $1 AND id = $2", [user_id, booking_id]);
        res.json(posts.rows[0]);
    } catch (error) {
        console.error("Error executing query", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
})

app.post("/booking", async (req, res) => {
    const { seatType, date, startTime, endTime, phoneNumber, email, userId } = req.body;
    const client = await pool.connect();
    try {
        const response = await client.query(
            "INSERT INTO bookings (title, date, start_time, end_time, phone_number, email, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [seatType, date, startTime, endTime, phoneNumber, email, userId]
        );
        res.status(201).json(response.rows[0]);
        res.json(response.rows[0]);
        console.log({ post: response.rows[0], message: "Booking created successfully" });
    } catch (error) {
        res.status(500).send(error);
    } finally {
        console.log("Client releasing")
        client.release();
    }
})

app.put("/booking/:booking_id", async (req, res) => {
    const { booking_id } = req.params;
    const { seatType, date, startTime, endTime, phoneNumber, email, userId } = req.body;
    const client = await pool.connect();
    try {
        const post = await client.query(
            "UPDATE bookings SET title = $1, date = $2, start_time = $3, end_time = $4, phone_number = $5, email = $6 WHERE id = $7 AND user_id = $8 RETURNING *",
            [seatType, date, startTime, endTime, phoneNumber, email, booking_id, userId]
        );
        if (post.rows.length > 0) {
            res.json(post.rows[0]);
            console.log({ post: json(post.rows[0]), message: "Post updated successfully." });
        } else {
            res.status(404).json({ error: "Post not found" });
        }
    } catch (error) {
        console.error("Error executing query", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
})

app.delete("/booking/:booking_id", async (req, res) => {
    const { booking_id } = req.params;
    const { userId } = req.body;
    const client = await pool.connect();
    try {
        const post = await client.query("DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *", [booking_id, userId]);
        if (post.rows.length > 0) {
            res.status(200).json({ post: post.rows[0], message: "Post deleted successfully" });
        } else {
            res.status(404).json({ error: "Post not found" });
        }
    } catch (error) {
        console.error("Error executing query", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
})

app.listen(3001, () => {
    console.log("Server is running on port 3001 `");
})