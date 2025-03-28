const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mydb',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Create users table if it doesn’t exist
async function setupDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL
            )
        `);
        console.log('Users table ready');
    } catch (err) {
        console.error('Error setting up database:', err);
    }
}

// Simulated Grok API call function
function grokMathOperation(num1, num2, operation, apiKey) {
    const validApiKey = "xai-kBLhWmpnWsnQiBBxIMtK6JsdPmoMIvo2vNazmAeVuhCKjZ7QkTmuEbOjuWOj0geyYuiMUrnjR0iKjDKK";
    if (apiKey !== validApiKey) {
        throw new Error("Invalid API key");
    }

    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    
    if (isNaN(n1) || isNaN(n2)) {
        throw new Error("Invalid numbers");
    }

    let result;
    let message;
    switch(operation.toLowerCase()) {
        case "add":
            result = n1 + n2;
            message = `The result of adding ${num1} and ${num2} is ${result}`;
            break;
        case "multiply":
            result = n1 * n2;
            message = `The result of multiplying ${num1} and ${num2} is ${result}`;
            break;
        case "hypotenuse":
            result = Math.sqrt(n1 * n1 + n2 * n2);
            message = `For a right triangle with base ${num1} and height ${num2}, the hypotenuse is ${result.toFixed(2)}`;
            break;
        default:
            throw new Error("Unsupported operation");
    }

    return {
        messages: [
            { role: "system", content: "You are a math assistant." },
            { role: "user", content: `Perform ${operation} on ${num1} and ${num2}` },
            { role: "assistant", content: message }
        ],
        model: "grok-2-latest",
        stream: false,
        temperature: 0,
        result: result
    };
}

// API endpoint for math operations
app.post('/api/math', (req, res) => {
    const { num1, num2, operation, apiKey } = req.body;

    try {
        const response = grokMathOperation(num1, num2, operation, apiKey);
        res.json(response);
    } catch (error) {
        res.status(400).json({
            messages: [
                { role: "system", content: "You are a math assistant." },
                { role: "user", content: `Perform ${operation} on ${num1} and ${num2}` },
                { role: "assistant", content: `Error: ${error.message}` }
            ]
        });
    }
});

// Endpoint to handle user info submission
app.post('/submit', async (req, res) => {
    const { name, age } = req.body;
    try {
        await pool.query('INSERT INTO users (name, age) VALUES ($1, $2)', [name, age]);
        res.send('Data saved successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving data');
    }
});

// Endpoint to search user by name
app.post('/search', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1 LIMIT 1', [name]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.send(`Found: Name: ${user.name}, Age: ${user.age}`);
        } else {
            res.send(`No user found with name: ${name}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error searching database');
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server and setup database
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await setupDatabase();
});